import 'package:app/pages/Splash_screen/splash_screen.dart';
import 'package:flutter/material.dart';

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
          colorScheme: ColorScheme.fromSeed(seedColor: Color.fromARGB(255, 243, 242, 243)),
          useMaterial3: true,
        ),
        home: const SplashScreen());
  }
}
