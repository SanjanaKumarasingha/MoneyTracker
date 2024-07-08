import 'package:app/home.dart';
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
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const Home(),
    );
  }
}
