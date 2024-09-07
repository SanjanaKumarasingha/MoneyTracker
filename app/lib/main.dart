import 'package:app/pages/Splash/splash_screen.dart';
import 'package:app/pages/Register/register.dart';
import 'package:flutter/material.dart';
import 'package:app/pages/Login/login_screen.dart';

void main() {
  runApp(const MoneyTracker());
}

class MoneyTracker extends StatelessWidget {
  const MoneyTracker({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        title: 'MoneyTracker',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          visualDensity: VisualDensity.adaptivePlatformDensity,
          colorScheme: ColorScheme.fromSeed(
              seedColor: const Color.fromARGB(255, 243, 242, 243)),
          useMaterial3: true,
        ),
        home: const RegisterPage());
  }
}
