from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from users.models import Empresa, Repartidor
from users.serializers import UserSerializer


User = get_user_model()


# ---------------------------------------------------
# 1) PRUEBAS DE MODELOS Y MANAGER (CustomUserManager)
# ---------------------------------------------------
class UserManagerTests(TestCase):
    def test_create_user_requiere_email(self):
        """M-01: create_user debe exigir email (rama que lanza ValueError)."""
        with self.assertRaisesMessage(ValueError, "Debe colocar un e-mail válido."):
            User.objects.create_user(email=None, password="Passw0rd123!")

    def test_create_user_flags_por_defecto(self):
        """M-02: create_user deja is_staff/is_superuser en False."""
        user = User.objects.create_user(
            email="user@test.com",
            password="Passw0rd123!",
            name="Usuario Normal"
        )
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.email, "user@test.com")

    def test_create_superuser_flags_en_true(self):
        """M-03: create_superuser pone is_staff e is_superuser en True."""
        admin = User.objects.create_superuser(
            email="admin@test.com",
            password="Passw0rd123!"
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)


class ModelsTests(TestCase):
    def test_empresa_str(self):
        """M-04: __str__ de Empresa devuelve el nombre."""
        user = User.objects.create_user(email="emp@test.com", password="Passw0rd123!")
        emp = Empresa.objects.create(user=user, nombre="Restaurante X")
        self.assertEqual(str(emp), "Restaurante X")

    def test_repartidor_str(self):
        """M-05: __str__ de Repartidor incluye el email."""
        user = User.objects.create_user(email="rep@test.com", password="Passw0rd123!")
        rep = Repartidor.objects.create(user=user)
        self.assertIn("rep@test.com", str(rep))

    def test_repartidor_estado_default(self):
        """M-06: Repartidor se crea con estado 'disponible' por defecto."""
        user = User.objects.create_user(email="rep2@test.com", password="Passw0rd123!")
        rep = Repartidor.objects.create(user=user)
        self.assertEqual(rep.estado, "disponible")


# ---------------------------------------
# 2) PRUEBAS DE SERIALIZER DE REGISTRO
# ---------------------------------------
class UserSerializerTests(TestCase):
    def test_serializer_email_nuevo_valido(self):
        """S-01: UserSerializer acepta email nuevo."""
        data = {
            "name": "Cliente Uno",
            "email": "cliente1@test.com",
            "password": "Passw0rd123!",
            "role": "usuarionormal",
            "telefono": "60000000",
            "direccion": "Calle 1"
        }
        serializer = UserSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_email_duplicado_invalido(self):
        """S-02: validate_email detecta correo ya registrado."""
        User.objects.create_user(email="dup@test.com", password="Passw0rd123!")
        data = {
            "name": "Otro",
            "email": "dup@test.com",
            "password": "Passw0rd123!",
            "role": "usuarionormal",
        }
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_serializer_role_admin_bloqueado(self):
        """S-03: validate_role no permite rol 'admin'."""
        data = {
            "name": "Malicioso",
            "email": "mal@test.com",
            "password": "Passw0rd123!",
            "role": "admin",
        }
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("role", serializer.errors)

    def test_create_usuario_normal(self):
        """S-04: create crea solo User cuando role=usuarionormal."""
        data = {
            "name": "Cliente Normal",
            "email": "cliente@test.com",
            "password": "Passw0rd123!",
            "role": "usuarionormal",
            "telefono": "60000000",
            "direccion": "Calle 1"
        }
        serializer = UserSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.role, "usuarionormal")
        self.assertEqual(user.telefono, "60000000")
        self.assertEqual(user.direccion, "Calle 1")
        self.assertFalse(Empresa.objects.filter(user=user).exists())
        self.assertFalse(hasattr(user, "repartidor"))

    def test_create_usuario_empresa_crea_empresa(self):
        """S-05: create crea Empresa si role=empresa y viene empresa.nombre."""
        data = {
            "name": "Dueño",
            "email": "empresa@test.com",
            "password": "Passw0rd123!",
            "role": "empresa",
            "empresa": {"nombre": "Mi Restaurante"},
        }
        serializer = UserSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.role, "empresa")
        self.assertTrue(Empresa.objects.filter(user=user, nombre="Mi Restaurante").exists())

    def test_create_usuario_repartidor_crea_repartidor(self):
        """S-06: create crea Repartidor cuando role=repartidor."""
        data = {
            "name": "Repartidor 1",
            "email": "repartidor@test.com",
            "password": "Passw0rd123!",
            "role": "repartidor",
        }
        serializer = UserSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.role, "repartidor")
        self.assertTrue(Repartidor.objects.filter(user=user).exists())
# ---------------------------------------------------
# 3) PRUEBAS DE ENDPOINTS (REGISTER / LOGIN / PROFILE)
# ---------------------------------------------------
class AuthAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.profile_url = reverse("user_profile")

        # usuario normal
        self.user_normal = User.objects.create_user(
            email="normal@test.com",
            password="Passw0rd123!",
            name="Normal",
            role="usuarionormal",
            telefono="60000001",
        )
        # usuario empresa + Empresa
        self.user_empresa = User.objects.create_user(
            email="empresa@test.com",
            password="Passw0rd123!",
            name="Owner",
            role="empresa",
        )
        self.empresa = Empresa.objects.create(
            user=self.user_empresa,
            nombre="Restaurante API",
        )
        # usuario repartidor + Repartidor
        self.user_repartidor = User.objects.create_user(
            email="repartidor@test.com",
            password="Passw0rd123!",
            name="Repartidor X",
            role="repartidor",
        )
        self.repartidor = Repartidor.objects.create(user=self.user_repartidor)

    # ---- Registro (RegisterView) ----
    def test_register_usuario_normal_ok(self):
        """R-01: /user/register/ con datos válidos crea usuario normal."""
        payload = {
            "name": "Cliente Uno",
            "email": "cliente_api@test.com",
            "password": "Passw0rd123!",
            "role": "usuarionormal",
            "telefono": "60000000",
            "direccion": "Calle API",
        }
        res = self.client.post(self.register_url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=payload["email"]).exists())

    def test_register_email_duplicado_api(self):
        """R-02: /user/register/ no permite correo duplicado."""
        User.objects.create_user(email="dup_api@test.com", password="Passw0rd123!")
        payload = {
            "name": "Otro",
            "email": "dup_api@test.com",
            "password": "Passw0rd123!",
            "role": "usuarionormal",
        }
        res = self.client.post(self.register_url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res.data)

    def test_register_role_admin_bloqueado_api(self):
        """R-03: /user/register/ bloquea intento de rol 'admin'."""
        payload = {
            "name": "Malicioso",
            "email": "admin_api@test.com",
            "password": "Passw0rd123!",
            "role": "admin",
        }
        res = self.client.post(self.register_url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", res.data)

    def test_register_empresa_crea_empresa_api(self):
        """R-04: /user/register/ con role=empresa crea Empresa."""
        payload = {
            "name": "Dueño API",
            "email": "empresa_api@test.com",
            "password": "Passw0rd123!",
            "role": "empresa",
            "empresa": {"nombre": "Restaurante Nuevo"},
        }
        res = self.client.post(self.register_url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="empresa_api@test.com")
        self.assertTrue(Empresa.objects.filter(user=user, nombre="Restaurante Nuevo").exists())

    # ---- Login (CustomTokenObtainPairView) ----
    def test_login_usuario_normal_ok(self):
        """L-01: login usuario normal devuelve access/refresh y rol."""
        res = self.client.post(
            self.login_url,
            {"email": "normal@test.com", "password": "Passw0rd123!"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["role"], "usuarionormal")
        self.assertEqual(res.data["email"], "normal@test.com")

    def test_login_empresa_incluye_empresaNombre(self):
        """L-02: login empresa incluye campo empresaNombre."""
        res = self.client.post(
            self.login_url,
            {"email": "empresa@test.com", "password": "Passw0rd123!"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["role"], "empresa")
        self.assertEqual(res.data.get("empresaNombre"), "Restaurante API")

    def test_login_repartidor_incluye_repartidor_id(self):
        """L-03: login repartidor incluye repartidor_model_id."""
        res = self.client.post(
            self.login_url,
            {"email": "repartidor@test.com", "password": "Passw0rd123!"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["role"], "repartidor")
        self.assertIsNotNone(res.data.get("repartidor_model_id"))

    def test_login_credenciales_invalidas(self):
        """L-04: login con credenciales incorrectas responde 401."""
        res = self.client.post(
            self.login_url,
            {"email": "normal@test.com", "password": "ClaveMala"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ---- Profile (UserProfileView) ----
    def test_profile_requiere_auth(self):
        """P-01: /user/profile/ sin token devuelve 401."""
        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_devuelve_datos_usuario(self):
        """P-02: /user/profile/ autenticado devuelve datos del usuario."""
        # primero logueamos para obtener access token
        login_res = self.client.post(
            self.login_url,
            {"email": "normal@test.com", "password": "Passw0rd123!"},
            format="json",
        )
        token = login_res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["email"], "normal@test.com")
        self.assertEqual(res.data["role"], "usuarionormal")
