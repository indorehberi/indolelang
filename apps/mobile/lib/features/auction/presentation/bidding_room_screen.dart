import 'dart:async';
import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import 'package:intl/intl.dart';

class BiddingRoomScreen extends StatefulWidget {
  final String sessionId;

  const BiddingRoomScreen({super.key, required this.sessionId});

  @override
  State<BiddingRoomScreen> createState() => _BiddingRoomScreenState();
}

class _BiddingRoomScreenState extends State<BiddingRoomScreen> {
  final ApiClient _apiClient = ApiClient();
  late IO.Socket _socket;
  
  bool _isLoading = true;
  Map<String, dynamic>? _sessionDetail;
  Map<String, dynamic>? _currentLot;
  List<dynamic> _bidHistory = [];
  
  int _timeRemaining = 0;
  bool _isBidCooldown = false;
  String? _winnerName;

  @override
  void initState() {
    super.initState();
    _fetchSessionDetail();
  }

  @override
  void dispose() {
    _socket.disconnect();
    _socket.dispose();
    super.dispose();
  }

  Future<void> _fetchSessionDetail() async {
    try {
      final response = await _apiClient.get('/public/sessions/${widget.sessionId}');
      if (response.statusCode == 200 && response.data['success'] == true) {
        setState(() {
          _sessionDetail = response.data['data'];
          // Use first lot as active lot for simulation
          if (_sessionDetail!['lots'] != null && _sessionDetail!['lots'].isNotEmpty) {
            _currentLot = _sessionDetail!['lots'][0];
            _timeRemaining = 120; // 2 minutes starting countdown simulation
          }
          _isLoading = false;
        });
        _initWebSocket();
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _initWebSocket() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? prefs.getString('token');

    // Initialize Socket.io connection to backend wsBaseUrl
    _socket = IO.io('http://10.0.2.2:8000', IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .setExtraHeaders({'Authorization': 'Bearer $token'})
      .build()
    );

    _socket.connect();

    _socket.onConnect((_) {
      print('Socket Connected: Bidding Room ${widget.sessionId}');
      _socket.emit('joinRoom', {'sessionId': widget.sessionId});
    });

    // Listen for WebSocket Broadcast events
    _socket.on('bidPlaced', (data) {
      if (mounted) {
        setState(() {
          _bidHistory.insert(0, data);
          if (_currentLot != null) {
            _currentLot!['starting_price'] = data['amount']; // update current price
          }
        });
      }
    });

    _socket.on('timerUpdate', (data) {
      if (mounted) {
        setState(() {
          _timeRemaining = data['timeRemaining'];
        });
      }
    });

    _socket.on('lotExtended', (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Waktu diperpanjang! (Anti-Sniping)'),
            backgroundColor: Colors.amber,
          ),
        );
      }
    });

    _socket.on('lotClosed', (data) {
      if (mounted) {
        setState(() {
          _winnerName = data['winnerName'];
        });
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Text('Lot Selesai!'),
            content: Text(data['winnerName'] != null
                ? 'Selamat kepada ${data['winnerName']} memenangkan lot ini.'
                : 'Lot ditutup tanpa penawar.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context); // exit bidding room
                },
                child: const Text('Kembali ke Home'),
              )
            ],
          ),
        );
      }
    });
  }

  void _submitBid() {
    if (_isBidCooldown || _currentLot == null) return;

    final currentPrice = double.tryParse(_currentLot!['starting_price'].toString()) ?? 0.0;
    // Calculate 5,000,000 auto bid increment
    final nextBidAmount = currentPrice + 5000000;

    // Send bid event via Socket
    _socket.emit('placeBid', {
      'lotId': _currentLot!['id'],
      'amount': nextBidAmount,
    });

    // Start 1.2 seconds cooldown trigger
    setState(() {
      _isBidCooldown = true;
    });

    Timer(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() {
          _isBidCooldown = false;
        });
      }
    });
  }

  String _formatRupiah(dynamic val) {
    if (val == null) return 'Rp 0';
    final number = double.tryParse(val.toString()) ?? 0.0;
    return NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(number);
  }

  String _formatTimer(int seconds) {
    final min = (seconds / 60).floor().toString().padLeft(2, '0');
    final sec = (seconds % 60).toString().padLeft(2, '0');
    return '$min:$sec';
  }

  @override
  Widget build(BuildContext context) {
    final asset = _currentLot?['asset'] ?? {};

    return Scaffold(
      backgroundColor: AppTheme.darkBgColor,
      appBar: AppBar(
        title: Text(_sessionDetail?['title'] ?? 'Ruang Kontrol Lelang'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // --- ACTIVE LOT INFO CARD ---
                Card(
                  margin: const EdgeInsets.all(16),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Text(
                              'Lot Ke-${_currentLot?['lot_number'] ?? 1}',
                              style: const TextStyle(fontSize: 14, color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                            ),
                            // Anti sniping timer warning (Red color if < 10 seconds)
                            Text(
                              _formatTimer(_timeRemaining),
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: _timeRemaining < 10 ? Colors.redAccent : Colors.amber,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          asset['title'] ?? 'Lot Mobil Aktif',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Penawaran Tertinggi Saat Ini', style: TextStyle(fontSize: 11, color: Colors.white54)),
                                const SizedBox(height: 4),
                                Text(
                                  _formatRupiah(_currentLot?['starting_price']),
                                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, py: 6),
                              decoration: BoxDecoration(
                                color: AppTheme.secondaryColor.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'English Auction',
                                style: TextStyle(color: AppTheme.secondaryColor, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            )
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                // --- BID HISTORY LIST ---
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20.0),
                  child: Text(
                    'Riwayat Penawaran Terbaru',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white70),
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.darkSurfaceColor,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: _bidHistory.isEmpty
                        ? const Center(
                            child: Text(
                              'Belum ada penawaran masuk.',
                              style: TextStyle(color: Colors.white30),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(12),
                            itemCount: _bidHistory.length,
                            itemBuilder: (context, idx) {
                              final bid = _bidHistory[idx];
                              return Container(
                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                                margin: const EdgeInsets.only(bottom: 8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.03),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.between,
                                  children: [
                                    Text(
                                      bid['userName'] ?? 'Peserta ${idx + 1}',
                                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                                    ),
                                    Text(
                                      _formatRupiah(bid['amount']),
                                      style: const TextStyle(color: AppTheme.secondaryColor, fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                ),

                // --- BID ACTION BUTTON ---
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: ElevatedButton(
                    onPressed: _isBidCooldown ? null : _submitBid,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      disabledBackgroundColor: AppTheme.primaryColor.withOpacity(0.4),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: _isBidCooldown
                        ? const Text('COOLDOWN (1.2s)', style: TextStyle(fontWeight: FontWeight.bold))
                        : Text(
                            'BID SEKARANG (+ ${_formatRupiah(5000000)})',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
              ],
            ),
    );
  }
}
