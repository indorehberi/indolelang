import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  final ApiClient _apiClient = ApiClient();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiClient.post('/auth/login', data: {
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
        final responseData = response.data['data'];
        
        await prefs.setString('accessToken', responseData['accessToken']);
        await prefs.setString('refreshToken', responseData['refreshToken']);
        
        if (context.mounted) {
          context.go('/home');
        }
      } else {
        setState(() {
          _errorMessage = response.data['error']?['message'] ?? 'Login gagal, periksa kredensial Anda.';
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
                    // Brand Logo / Icon
                    Center(
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.gavel_rounded,
                          size: 48,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Selamat Datang',
                      textAlign: Center,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Masuk ke akun Indo-Lelang Anda',
                      textAlign: Center,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white54,
                      ),
                    ),
                    const SizedBox(height: 32),
                    
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
                    const SizedBox(height: 20),

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
                        return null;
                      },
                    ),
                    const SizedBox(height: 32),

                    // Login Button
                    ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
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
                              'Masuk',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                    ),
                    const SizedBox(height: 24),

                    // Register Navigation
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Belum punya akun? ',
                          style: TextStyle(color: Colors.white54),
                        ),
                        GestureDetector(
                          onTap: () => context.go('/register'),
                          child: const Text(
                            'Daftar Sekarang',
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
