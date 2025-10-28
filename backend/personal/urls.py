from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PersonalViewSet

# Router para personal
personal_router = DefaultRouter()
personal_router.register(r"", PersonalViewSet, basename="personal")

urlpatterns = [
    path('', include(personal_router.urls)),
]
