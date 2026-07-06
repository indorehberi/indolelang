import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  final ApiClient _apiClient = ApiClient();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiClient.post('/auth/register', data: {
        'full_name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
        'confirm_password': _confirmPasswordController.text,
        'role': 'bidder', // Default role for mobile signups
      });

      if (response.statusCode == 201 && response.data['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Registrasi Berhasil! Silakan masuk.'),
              backgroundColor: AppTheme.secondaryColor,
            ),
          );
          context.go('/login');
        }
      } else {
        setState(() {
          _errorMessage = response.data['error']?['message'] ?? 'Pendaftaran gagal, silakan coba lagi.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Gagal terhubung ke server. Silakan coba lagi.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBgColor,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 32.0),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.person_add_alt_1_rounded,
                          size: 40,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Pendaftaran Akun',
                      textAlign: Center,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Daftar akun Bidder Indo-Lelang baru',
                      textAlign: Center,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.white54,
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    if (_errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.withOpacity(0.3)),
                        ),
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Username/FullName Field
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Nama Lengkap',
                        prefixIcon: Icon(Icons.person_outline),
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Nama lengkap wajib diisi';
                        }
                        if (value.trim().length < 3) {
                          return 'Nama minimal 3 karakter';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Email Field
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Alamat Email',
                        prefixIcon: Icon(Icons.email_outlined),
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Email wajib diisi';
                        }
                        if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                          return 'Format email tidak valid';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Password Field
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: 'Kata Sandi',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                        border: const OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Kata sandi wajib diisi';
                        }
                        if (value.length < 8) {
                          return 'Kata sandi minimal 8 karakter';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Confirm Password Field
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: _obscurePassword,
                      decoration: const InputDecoration(
                        labelText: 'Konfirmasi Kata Sandi',
                        prefixIcon: Icon(Icons.lock_reset_outlined),
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Konfirmasi kata sandi wajib diisi';
                        }
                        if (value != _passwordController.text) {
                          return 'Konfirmasi kata sandi tidak cocok';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 28),

                    // Register Button
                    ElevatedButton(
                      onPressed: _isLoading ? null : _handleRegister,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              'Daftar',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                    ),
                    const SizedBox(height: 24),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Sudah punya akun? ',
                          style: TextStyle(color: Colors.white54),
                        ),
                        GestureDetector(
                          onTap: () => context.go('/login'),
                          child: const Text(
                            'Masuk Sekarang',
                            style: TextStyle(
                              color: AppTheme.primaryColor,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
