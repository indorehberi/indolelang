import 'package:flutter/material';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors matching web Design System
  static const Color primaryColor = Color(0xFFF67904);     // #f67904
  static const Color secondaryColor = Color(0xFF178630);   // #178630 (Success Green)
  static const Color accentColor = Color(0xFF1B4F72);      // #1B4F72 (Deep Blue)
  
  static const Color darkBgColor = Color(0xFF12141C);       // Dark background
  static const Color darkSurfaceColor = Color(0xFF1D2128);  // Card/Surface background
  static const Color darkBorderColor = Color(0xFF2F3640);
  
  static const Color lightBgColor = Color(0xFFF5F6FA);
  static const Color lightSurfaceColor = Colors.white;
  static const Color lightBorderColor = Color(0xFFE1E2E6);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: lightBgColor,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.light,
        primary: primaryColor,
        secondary: secondaryColor,
        surface: lightSurfaceColor,
        error: const Color(0xFFD63031),
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme),
      cardTheme: CardTheme(
        color: lightSurfaceColor,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: lightBorderColor, width: 1),
        ),
        elevation: 0,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: lightSurfaceColor,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.black87),
        titleTextStyle: TextStyle(
          color: Colors.black87,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: darkBgColor,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.dark,
        primary: primaryColor,
        secondary: secondaryColor,
        surface: darkSurfaceColor,
        error: const Color(0xFFE84118),
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
      cardTheme: CardTheme(
        color: darkSurfaceColor,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: darkBorderColor, width: 1),
        ),
        elevation: 0,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkSurfaceColor,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.white),
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
