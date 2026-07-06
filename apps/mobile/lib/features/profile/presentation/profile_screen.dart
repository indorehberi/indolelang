import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiClient _apiClient = ApiClient();
  
  bool _isLoading = true;
  Map<String, dynamic>? _userProfile;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    try {
      final response = await _apiClient.get('/users/profile');
      if (response.statusCode == 200 && response.data['success'] == true) {
        setState(() {
          _userProfile = response.data['data'];
          _isLoading = false;
        });
      }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBgColor,
      appBar: AppBar(
        title: const Text('Profil Pengguna'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // --- USER AVATAR & NAME CARD ---
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 40,
                            backgroundColor: AppTheme.primaryColor.withOpacity(0.15),
                            child: const Icon(
                              Icons.person_rounded,
                              size: 44,
                              color: AppTheme.primaryColor,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _userProfile?['full_name'] ?? 'Nama Pengguna',
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, py: 4),
                            decoration: BoxDecoration(
                              color: Colors.white10,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              (_userProfile?['role'] ?? 'Bidder').toUpperCase(),
                              style: const TextStyle(fontSize: 10, color: Colors.white70, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // --- DETAILS LIST ---
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Informasi Akun',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white70),
                          ),
                          const Divider(height: 24, color: AppTheme.darkBorderColor),
                          _buildDetailRow('Email', _userProfile?['email'] ?? '-'),
                          const Divider(height: 20, color: Colors.transparent),
                          _buildDetailRow('No. Telepon', _userProfile?['phone'] ?? 'Tidak terdaftar'),
                          const Divider(height: 20, color: Colors.transparent),
                          _buildDetailRow('Status Akun', (_userProfile?['status'] ?? 'pending').toUpperCase()),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // --- LOGOUT BUTTON ---
                  ElevatedButton.icon(
                    onPressed: _handleLogout,
                    icon: const Icon(Icons.logout_rounded),
                    label: const Text('Keluar Aplikasi'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red.withOpacity(0.1),
                      foregroundColor: Colors.redAccent,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: Colors.redAccent, width: 1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.between,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.white54, fontSize: 13),
        ),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
        ),
      ],
    );
  }
}
