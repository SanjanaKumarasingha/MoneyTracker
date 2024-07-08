import 'package:flutter/material.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Tech Style Dashboard',
      theme: ThemeData(
        primaryColor: const Color(0xff368983),
        hintColor: const Color.fromARGB(255, 47, 125, 121),
        textTheme: const TextTheme(
          displayLarge: TextStyle(
              fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
          displayMedium: TextStyle(
              fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
          bodyLarge: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Color.fromARGB(255, 216, 216, 216)),
        ),
      ),
      home: const Head(),
    );
  }
}

class Head extends StatelessWidget {
  const Head({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                Header(),
                BalanceCard(),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class Header extends StatelessWidget {
  const Header({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 240,
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
      ),
      child: const Stack(
        children: [
          Positioned(
            top: 35,
            right: 10,
            child: NotificationIcon(),
          ),
          Padding(
            padding: EdgeInsets.only(top: 35, left: 10),
            child: Greeting(),
          ),
        ],
      ),
    );
  }
}

class NotificationIcon extends StatelessWidget {
  const NotificationIcon({super.key});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(7),
      child: Container(
        height: 40,
        width: 40,
        color: const Color.fromRGBO(250, 250, 250, 0.1),
        child: const Icon(
          Icons.notifications_outlined,
          size: 30,
          color: Colors.white,
        ),
      ),
    );
  }
}

class Greeting extends StatelessWidget {
  const Greeting({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Good afternoon',
          style: TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 16,
            color: Color.fromARGB(255, 224, 223, 223),
          ),
        ),
        Text(
          'Sanjana Kumarasingha',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 20,
            color: Colors.white,
          ),
        ),
      ],
    );
  }
}

class BalanceCard extends StatelessWidget {
  const BalanceCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 140,
      left: 38,
      child: Container(
        height: 170,
        width: 320,
        decoration: BoxDecoration(
          boxShadow: const [
            BoxShadow(
              color: Color.fromRGBO(47, 125, 121, 0.3),
              offset: Offset(0, 6),
              blurRadius: 12,
              spreadRadius: 6,
            ),
          ],
          color: Theme.of(context).colorScheme.secondary,
          borderRadius: BorderRadius.circular(15),
        ),
        child: const BalanceDetails(),
      ),
    );
  }
}

class BalanceDetails extends StatelessWidget {
  const BalanceDetails({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        SizedBox(height: 10),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 15),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total Balance',
                style: TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 16,
                    color: Colors.white),
              ),
              Icon(
                Icons.more_horiz,
                color: Colors.white,
              ),
            ],
          ),
        ),
        SizedBox(height: 7),
        Padding(
          padding: EdgeInsets.only(left: 15),
          child: Row(
            children: [
              Text(
                '25',
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 25,
                    color: Colors.white),
              ),
            ],
          ),
        ),
        SizedBox(height: 25),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 15),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IncomeExpenseColumn(
                  title: 'Income', amount: '60', icon: Icons.arrow_downward),
              IncomeExpenseColumn(
                  title: 'Expenses', amount: '90', icon: Icons.arrow_upward),
            ],
          ),
        ),
        SizedBox(height: 6),
      ],
    );
  }
}

class IncomeExpenseColumn extends StatelessWidget {
  final String title;
  final String amount;
  final IconData icon;

  const IncomeExpenseColumn({
    super.key,
    required this.title,
    required this.amount,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            CircleAvatar(
              radius: 13,
              backgroundColor: const Color.fromARGB(255, 85, 145, 141),
              child: Icon(
                icon,
                color: Colors.white,
                size: 19,
              ),
            ),
            const SizedBox(width: 7),
            Text(
              title,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          amount,
          style: Theme.of(context).textTheme.displayMedium,
        ),
      ],
    );
  }
}
