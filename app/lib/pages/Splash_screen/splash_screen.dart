import 'package:app/pages/loading_page.dart';
import 'package:flutter/material.dart';
import 'package:app/components/image_view.dart';
import 'package:app/utils/export.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
        child: Scaffold(
            backgroundColor: Theme.of(context).colorScheme.primary,
            body: const SizedBox(
              width: double.maxFinite,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(height: 10),
                  CustomImageView(
                    imagePath: ImageConstant.imgLogo,
                    width: 200,
                    height: 500,
                  ),
                ],
              ),
            )));
  }
}
