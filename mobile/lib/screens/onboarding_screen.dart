import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'auth/login_screen.dart';
import 'auth/register_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingData> _pages = [
    OnboardingData(
      title: 'Compra con Inteligencia',
      description:
          'Descubre productos increíbles con recomendaciones personalizadas y ofertas exclusivas solo para ti.',
      icon: Icons.shopping_bag_outlined,
      color: Colors.blue,
    ),
    OnboardingData(
      title: 'Seguimiento en Tiempo Real',
      description:
          'Rastrea tus pedidos en tiempo real desde el momento de la compra hasta la entrega en tu puerta.',
      icon: Icons.local_shipping_outlined,
      color: Colors.purple,
    ),
    OnboardingData(
      title: 'Experiencia Premium',
      description:
          'Disfruta de una experiencia de compra única con pagos seguros y atención al cliente 24/7.',
      icon: Icons.stars_outlined,
      color: Colors.orange,
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _markOnboardingSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_seen_onboarding', true);
  }

  void _goToLogin() async {
    await _markOnboardingSeen();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  void _goToRegister() async {
    await _markOnboardingSeen();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const RegisterScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentPage > 0)
                    TextButton(
                      onPressed: _previousPage,
                      child: const Text(
                        'Atrás',
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                    )
                  else
                    const SizedBox(width: 60),
                  TextButton(
                    onPressed: _goToLogin,
                    child: const Text(
                      'Omitir',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  ),
                ],
              ),
            ),

            // Page view
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemCount: _pages.length,
                itemBuilder: (context, index) {
                  return _buildPage(_pages[index]);
                },
              ),
            ),

            // Page indicators
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  _pages.length,
                  (index) => Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: _currentPage == index ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _currentPage == index
                          ? _pages[index].color
                          : Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ),
            ),

            // Navigation buttons
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: _currentPage < _pages.length - 1
                  ? Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _nextPage,
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(
                                color: _pages[_currentPage].color,
                                width: 2,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: Text(
                              'Siguiente',
                              style: TextStyle(
                                fontSize: 16,
                                color: _pages[_currentPage].color,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    )
                  : Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: _goToLogin,
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(
                                    color: Colors.blue,
                                    width: 2,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 16,
                                  ),
                                ),
                                child: const Text(
                                  'Iniciar Sesión',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.blue,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: _goToRegister,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.blue,
                                  foregroundColor: Colors.white,
                                  elevation: 4,
                                  shadowColor: Colors.blue.withOpacity(0.3),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 16,
                                  ),
                                ),
                                child: const Text(
                                  'Crear Cuenta',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPage(OnboardingData data) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icon container
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: data.color.withOpacity(0.1),
              shape: BoxShape.circle,
              border: Border.all(color: data.color.withOpacity(0.3), width: 2),
            ),
            child: Icon(data.icon, size: 60, color: data.color),
          ),

          const SizedBox(height: 40),

          // Title
          Text(
            data.title,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: data.color,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 20),

          // Description
          Text(
            data.description,
            style: const TextStyle(
              fontSize: 16,
              color: Colors.grey,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class OnboardingData {
  final String title;
  final String description;
  final IconData icon;
  final Color color;

  OnboardingData({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
  });
}
