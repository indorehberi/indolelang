import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/auction/presentation/bidding_room_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';

final appRouterHelperProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) async {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken') ?? prefs.getString('token');
      final isLoggedIn = token != null && token.isNotEmpty;
      
      final goingToAuth = state.matchedLocation == '/login' || state.matchedLocation == '/register';

      if (state.matchedLocation == '/') {
        return isLoggedIn ? '/home' : '/login';
      }

      if (!isLoggedIn && !goingToAuth) {
        return '/login';
      }

      if (isLoggedIn && goingToAuth) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const Scaffold(
          body: Center(
            child: CircularProgressIndicator(),
          ),
        ),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/bidding/:sessionId',
        builder: (context, state) {
          final sessionId = state.pathParameters['sessionId'] ?? '';
          return BiddingRoomScreen(sessionId: sessionId);
        },
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
});
