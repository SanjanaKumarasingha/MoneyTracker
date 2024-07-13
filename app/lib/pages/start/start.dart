import 'package:flutter/material.dart';
import 'package:app/components/image_view.dart';
import 'package:app/routes/app_routes.dart';

class GetStarted extends StatelessWidget {
  const GetStarted({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.maxFinite,
        padding: const EdgeInsets.all(20),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Money Tracker',
                style: TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                  decorationColor: Colors.blue,
                  decorationThickness: 2,
                  shadows: [
                  Shadow(
                    color: Colors.black,
                    offset: Offset(2, 2),
                    blurRadius: 2,
                  ),
                  ],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              const Text(
                'Track your expenses and income easily',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              const CustomImageView(
                imagePath: 'images/logo.jpeg',
                width: 100,
                height: 100,
              ),
              const SizedBox(height: 30),
              _loginButton(context),
              const SizedBox(height: 10),
              _registerButton(context),
              const SizedBox(height: 20),
              const Text(
                "or continue with",
                style: TextStyle(
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              _signInGoogleButton(context),
              const SizedBox(height: 10),
              _signInAppleButton(context),
            ],
          ),
        ),
      ),
    );
  }
}

Widget _loginButton(BuildContext context) {
  return SizedBox(
    width: 275,
    child: ElevatedButton(
      onPressed: () {
        Navigator.pushNamed(context, AppRoutes.login);
      },
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 15),
        backgroundColor: Color.fromARGB(255, 174, 228, 239),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
        ),
      ),
      child: const Text('Login'),
    ),
  );
}

Widget _registerButton(BuildContext context) {
  return SizedBox(
    width: 275,
    child: ElevatedButton(
      onPressed: () {
        Navigator.pushNamed(context, AppRoutes.register);
      },
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 15),
        backgroundColor: Color.fromARGB(255, 174, 228, 239),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
        ),
      ),
      child: const Text('Register'),
    ),
  );
}

Widget _signInGoogleButton(BuildContext context) {
  return SizedBox(
    width: 250,
    child: ElevatedButton(
      onPressed: () {
        onTapSignInWithGoogle(context);
      },
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 15),
        backgroundColor: Color.fromARGB(255, 155, 230, 245),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(
            'images/google_logo.png',
            height: 24,
            width: 24,
          ),
          const SizedBox(width: 10),
          const Text('Sign in with Google'),
        ],
      ),
    ),
  );
}

Widget _signInAppleButton(BuildContext context) {
  return SizedBox(
    width: 250,
    child: ElevatedButton(
      onPressed: () {
        Navigator.pushNamed(context, '/login');
      },
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 15),
        backgroundColor: Color.fromARGB(255, 155, 230, 245),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(
            'images/apple_logo.png',
            height: 24,
            width: 24,
          ),
          const SizedBox(width: 10),
          const Text('Sign in with Apple'),
        ],
      ),
    ),
  );
}

void onTapSignInWithGoogle(BuildContext context) {
  // Implement Google sign-in logic here
}
