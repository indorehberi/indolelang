import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String defaultBaseUrl = 'http://10.0.2.2:8000/api/v1'; // 10.0.2.2 is Android emulator local ip

  final Dio _dio;

  ApiClient({String? baseUrl}) : _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl ?? defaultBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('accessToken') ?? prefs.getString('token');
          
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          // Global Error Logger/Mapper
          print('API Client Error [${error.response?.statusCode}]: ${error.message}');
          return handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;

  // Convenience Methods
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return _dio.post(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> put(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return _dio.put(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> delete(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return _dio.delete(path, data: data, queryParameters: queryParameters);
  }
}
