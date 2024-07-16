import 'package:flutter/foundation.dart';

class AuthService with ChangeNotifier {
  Future<void> login(String username, String password) async {
    await Future.delayed(const Duration(seconds: 2)); // Simulate network call
    // Here you can add your actual login logic
  }
}
