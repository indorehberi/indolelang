import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import 'package:intl/intl.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiClient _apiClient = ApiClient();
  
  bool _isLoading = true;
  List<dynamic> _featuredLots = [];
  Map<String, dynamic> _stats = {
    'total_lots_sold': 1200,
    'total_users': 3400,
    'total_sales': 120000000000,
  };

  @override
  void initState() {
    super.initState();
    _fetchHomeData();
  }

  Future<void> _fetchHomeData() async {
    try {
      final resLots = await _apiClient.get('/public/lots/featured');
      final resStats = await _apiClient.get('/public/stats');
      
      setState(() {
        if (resLots.statusCode == 200 && resLots.data['success'] == true) {
          _featuredLots = resLots.data['data'];
        }
        if (resStats.statusCode == 200 && resStats.data['success'] == true) {
          _stats = resStats.data['data'];
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    if (mounted) {
      context.go('/login');
    }
  }

  String _formatRupiah(dynamic val) {
    if (val == null) return 'Rp 0';
    final number = double.tryParse(val.toString()) ?? 0.0;
    return NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(number);
  }

  String? _getAssetImageUrl(dynamic asset) {
    if (asset == null) return null;
    
    final images = asset['images'];
    if (images != null) {
      if (images is List && images.isNotEmpty) {
        return images[0].toString();
      } else if (images is String && images.isNotEmpty) {
        if (images.startsWith('[')) {
          final clean = images.replaceAll('[', '').replaceAll(']', '').replaceAll('"', '').replaceAll('\'', '');
          final parts = clean.split(',');
          if (parts.isNotEmpty && parts[0].trim().isNotEmpty) {
            return parts[0].trim();
          }
        } else {
          return images;
        }
      }
    }
    
    if (asset['image_url'] != null && asset['image_url'].toString().isNotEmpty) {
      return asset['image_url'].toString();
    }
    
    final photos = asset['photos'];
    if (photos != null) {
      if (photos is List && photos.isNotEmpty) {
        return photos[0].toString();
      } else if (photos is String && photos.isNotEmpty) {
        if (photos.startsWith('[')) {
          final clean = photos.replaceAll('[', '').replaceAll(']', '').replaceAll('"', '').replaceAll('\'', '');
          final parts = clean.split(',');
          if (parts.isNotEmpty && parts[0].trim().isNotEmpty) {
            return parts[0].trim();
          }
        } else {
          return photos;
        }
      }
    }
    
    return null;
  }

  String _resolveImageUrl(String? path) {
    if (path == null || path.isEmpty) {
      return "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600";
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    final cleanPath = path.startsWith('/') ? path : '/$path';
    const base = 'http://10.0.2.2:8000';
    return '$base$cleanPath';
  }

  Widget _buildLotImage(dynamic asset) {
    final path = _getAssetImageUrl(asset);
    final imageUrl = _resolveImageUrl(path);
    
    return Image.network(
      imageUrl,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return const Center(child: CircularProgressIndicator(strokeWidth: 2));
      },
      errorBuilder: (context, error, stackTrace) {
        return const Center(
          child: Icon(Icons.image_outlined, size: 48, color: Colors.white30),
        );
      },
    );
  }

  void _showCategoryInfo(String category) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Kategori $category'),
        content: Text('Sesi lelang untuk kategori $category akan segera hadir!'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBgColor,
      appBar: AppBar(
        title: const Text('BIDKU INDO-LELANG'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () => context.push('/profile'),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchHomeData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // --- PLATFORM STATS ---
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Platform Stats (Real-Time)',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white70),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.between,
                              children: [
                                _buildStatItem('Lot Terjual', '${_stats['total_lots_sold'] ?? 0}'),
                                _buildStatItem('Users Aktif', '${_stats['total_users'] ?? 0}'),
                                _buildStatItem('Transaksi', _formatRupiah(_stats['total_sales']).replaceAll('Rp ', '')),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // --- CATEGORIES GRID ---
                    const Text(
                      'Kategori Aset',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 12),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.6,
                      children: [
                        _buildCategoryCard('Mobil', Icons.directions_car_filled_rounded, true),
                        _buildCategoryCard('Sepeda Motor', Icons.motorcycle_rounded, false),
                        _buildCategoryCard('Alat Berat', Icons.construction_rounded, false),
                        _buildCategoryCard('Properti', Icons.home_work_rounded, false),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // --- FEATURED LOTS ---
                    const Text(
                      'Lelang Unggulan (Mobil)',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 12),
                    
                    if (_featuredLots.isEmpty)
                      const Card(
                        child: Padding(
                          padding: EdgeInsets.all(24.0),
                          child: Text(
                            'Tidak ada lelang aktif saat ini.',
                            textAlign: Center,
                            style: TextStyle(color: Colors.white54),
                          ),
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _featuredLots.length,
                        itemBuilder: (context, idx) {
                          final lot = _featuredLots[idx];
                          final asset = lot['asset'] ?? {};
                          final session = lot['session'] ?? {};
                          
                          return Card(
                            margin: const EdgeInsets.only(bottom: 16),
                            clipBehavior: Clip.antiAlias,
                            child: InkWell(
                              onTap: () {
                                if (lot['session_id'] != null) {
                                  context.push('/bidding/${lot['session_id']}');
                                }
                              },
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  AspectRatio(
                                    aspectRatio: 4 / 3,
                                    child: Container(
                                      color: Colors.grey[900],
                                      child: _buildLotImage(asset),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(16.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.between,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                asset['title'] ?? 'Lot Aset Mobil',
                                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, py: 4),
                                              decoration: BoxDecoration(
                                                color: lot['status'] == 'active' ? AppTheme.secondaryColor.withOpacity(0.2) : Colors.amber.withOpacity(0.2),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                lot['status'] == 'active' ? 'LIVE NOW' : 'SOON',
                                                style: TextStyle(
                                                  color: lot['status'] == 'active' ? AppTheme.secondaryColor : Colors.amber,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          'Sesi: ${session['title'] ?? 'Sesi Lelang'}',
                                          style: const TextStyle(fontSize: 12, color: Colors.white54),
                                        ),
                                        const SizedBox(height: 12),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.between,
                                          children: [
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                const Text('Harga Dasar', style: TextStyle(fontSize: 10, color: Colors.white54)),
                                                Text(
                                                  _formatRupiah(lot['starting_price']),
                                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                                                ),
                                              ],
                                            ),
                                            const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Colors.white30),
                                          ],
                                        ),
                                      ],
                                    ),
                                  )
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.white54),
        ),
      ],
    );
  }

  Widget _buildCategoryCard(String label, IconData icon, bool isActive) {
    return Card(
      color: isActive ? AppTheme.darkSurfaceColor : AppTheme.darkSurfaceColor.withOpacity(0.4),
      child: InkWell(
        onTap: () {
          if (isActive) {
            // Already filtered mobil on list
          } else {
            _showCategoryInfo(label);
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  Icon(icon, color: isActive ? AppTheme.primaryColor : Colors.white38, size: 28),
                  if (!isActive)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, py: 2),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text('SOON', style: TextStyle(color: Colors.amber, fontSize: 8, fontWeight: FontWeight.bold)),
                    )
                ],
              ),
              const SizedBox(height: 12),
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isActive ? Colors.white : Colors.white38,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
