import 'package:flutter/material.dart';
import 'package:app/pages/start/start.dart';
import 'package:app/pages/home.dart';

class AppRoutes {
  static const String splash = '/';
  static const String start = '/start';
  static const String register = '/register';
  static const String login = '/login';
  static const String fogetPassword = '/forget-password';
  static const String opt = '/otp';
  static const String resetPassword = '/reset-password';
  static const String home = '/home';
  static const String addTransaction = '/add-transaction';
  static const String transactionDetails = '/transaction-details';
  static const String settings = '/settings';
  static const String profile = '/profile';
  static const String categories = '/categories';
  static const String categoryDetails = '/category-details';
  static const String addCategory = '/add-category';
  static const String editCategory = '/edit-category';
  static const String addIncome = '/add-income';
  static const String addExpense = '/add-expense';
  static const String editTransaction = '/edit-transaction';
  static const String editIncome = '/edit-income';
  static const String editExpense = '/edit-expense';
  static const String report = '/report';

  static Map<String, WidgetBuilder> routes = {
    splash: (context) => const GetStarted(),
    start: (context) => const GetStarted(),
    home: (context) => const Home(),
  };
}
