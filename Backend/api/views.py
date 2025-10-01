from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Empresa, Producto, Pedido, Cart, CartItem, DireccionUsuario
from .serializers import EmpresaSerializer, ProductoSerializer, PedidoSerializer, CartSerializer, DireccionUsuarioSerializer
from .models import UbicacionRepartidor
from django.db import transaction
from .serializers import UbicacionRepartidorSerializer


class DireccionUsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = DireccionUsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DireccionUsuario.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.all()
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='my-cart')
    def my_cart(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='add-item')
    def add_item(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        producto_id = request.data.get('producto_id')
        quantity = int(request.data.get('quantity', 1))
        if not producto_id:
            return Response({'error': 'producto_id requerido'}, status=400)
        item, created = CartItem.objects.get_or_create(cart=cart, producto_id=producto_id)
        item.quantity = quantity
        item.save()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='remove-item')
    def remove_item(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        producto_id = request.data.get('producto_id')
        if not producto_id:
            return Response({'error': 'producto_id requerido'}, status=400)
        CartItem.objects.filter(cart=cart, producto_id=producto_id).delete()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='clear-cart')
    def clear_cart(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        CartItem.objects.filter(cart=cart).delete()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

class EmpresaViewSet(viewsets.ModelViewSet):
    # Endpoint para obtener los productos de una empresa específica
    @action(detail=True, methods=['get'], url_path='products', permission_classes=[])
    def products(self, request, pk=None):
        try:
            empresa = Empresa.objects.get(pk=pk)
        except Empresa.DoesNotExist:
            return Response({'error': 'Empresa no encontrada'}, status=404)
        productos = Producto.objects.filter(empresa=empresa)
        serializer = ProductoSerializer(productos, many=True)
        return Response(serializer.data)
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer

    # Endpoint público para listar todas las empresas
    @action(detail=False, methods=['get'], url_path='public', permission_classes=[])
    def public(self, request):
        search = request.query_params.get('search', None)
        empresas = Empresa.objects.all()
        if search:
            empresas = empresas.filter(nombre__icontains=search)
        serializer = self.get_serializer(empresas, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        # El usuario puede ver solo sus propias empresas
        return Empresa.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Al crear empresa, se asigna el usuario autenticado
        serializer.save(user=self.request.user)

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]

    # Endpoint público para listar y buscar productos
    @action(detail=False, methods=['get'], url_path='public', permission_classes=[])
    def public(self, request):
        search = request.query_params.get('search', None)
        productos = Producto.objects.all()
        if search:
            productos = productos.filter(nombre__icontains=search)
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'empresa':
            empresas = user.empresas.all()
            return Producto.objects.filter(empresa__in=empresas)
        return Producto.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, 'role') or user.role != 'empresa':
            raise PermissionDenied("Solo usuarios con rol 'empresa' pueden crear productos.")

        empresas = user.empresas.all()
        if not empresas.exists():
            raise PermissionDenied("Usuario no tiene ninguna empresa asociada.")
        # Aquí se debería especificar la empresa a la que se le ,
        # Por simplicidad, asignamos a la primera empresa:
        empresa = empresas.first()
        serializer.save(empresa=empresa)

class PedidoViewSet(viewsets.ModelViewSet):

    @action(detail=False, methods=['post'], url_path='crear-multiple')
    def crear_multiple(self, request):
        pedidos_data = request.data.get('pedidos', [])
        if not pedidos_data or not isinstance(pedidos_data, list):
            return Response({'error': 'Se requiere una lista de pedidos en el campo "pedidos".'}, status=400)
        
        pedidos_creados = []
        
        try:
            with transaction.atomic():  # Transacción atómica para que todo se guarde o nada
                for i, pedido_data in enumerate(pedidos_data):
                    # Validar datos mínimos requeridos
                    if not pedido_data.get('empresa_id'):
                        return Response({'error': f'El pedido {i+1} debe tener empresa_id'}, status=400)
                    if not pedido_data.get('items') or not isinstance(pedido_data.get('items'), list):
                        return Response({'error': f'El pedido {i+1} debe tener items'}, status=400)
                    
                    # Verificar que la empresa existe
                    try:
                        from .models import Empresa
                        empresa = Empresa.objects.get(id=pedido_data['empresa_id'])
                    except Empresa.DoesNotExist:
                        return Response({'error': f'La empresa con ID {pedido_data["empresa_id"]} no existe'}, status=400)
                    
                    # Verificar que todos los productos existen
                    from .models import Producto
                    for j, item in enumerate(pedido_data['items']):
                        producto_id = item.get('producto_id')
                        if not producto_id:
                            return Response({'error': f'El item {j+1} del pedido {i+1} debe tener producto_id'}, status=400)
                        try:
                            producto = Producto.objects.get(id=producto_id)
                        except Producto.DoesNotExist:
                            return Response({'error': f'El producto con ID {producto_id} no existe'}, status=400)
                    
                    # Crear el pedido usando el serializer
                    serializer = self.get_serializer(data=pedido_data)
                    if serializer.is_valid():
                        pedido = serializer.save(cliente=request.user)
                        pedidos_creados.append(self.get_serializer(pedido).data)
                    else:
                        return Response({
                            'error': f'Error de validación en el pedido {i+1}',
                            'detalles': serializer.errors
                        }, status=400)
                        
                return Response({'pedidos': pedidos_creados}, status=201)
                
        except Exception as e:
            return Response({'error': f'Error al procesar los pedidos: {str(e)}'}, status=500)

    @action(detail=False, methods=['get'], url_path='historial') #historial de pedidos
    def historial(self, request):
        user = request.user
        if user.role == 'usuarionormal':
            pedidos = Pedido.objects.filter(cliente=user)
        elif user.role == 'empresa':
            empresas = user.empresas.all()
            pedidos = Pedido.objects.filter(empresa__in=empresas)
        elif user.role == 'repartidor':
            pedidos = Pedido.objects.filter(repartidor__user=user)
        else:
            pedidos = Pedido.objects.none()
        
        serializer = self.get_serializer(pedidos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='ventas-semanales')
    def ventas_semanales(self, request):
        user = request.user
        if user.role != 'empresa':
            return Response({'error': 'No autorizado'}, status=403)
        empresas = user.empresas.all()
        pedidos = Pedido.objects.filter(empresa__in=empresas, fecha_pedido__gte=timezone.now()-timedelta(days=7))
        # Inicializar ventas por día (Lunes=0 ... Domingo=6)
        ventas = [0 for _ in range(7)]
        for pedido in pedidos:
            dia = pedido.fecha_pedido.weekday()
            ventas[dia] += float(pedido.total)
        # Reordenar para que el lunes sea el primero
        return Response({
            'labels': ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            'ventas': ventas
        })
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'empresa':
            empresas = user.empresas.all()
            return Pedido.objects.filter(empresa__in=empresas)
        elif user.role == 'usuarionormal':
            return Pedido.objects.filter(cliente=user)
        elif user.role == 'repartidor':
            from django.db.models import Q
            return Pedido.objects.filter(Q(repartidor__isnull=True) | Q(repartidor__user=user))
        else:
            return Pedido.objects.none()

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)


class GuardarUbicacionRepartidor(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            latitud = request.data.get('latitud')
            longitud = request.data.get('longitud')
            
            if not latitud or not longitud:
                return Response({'error': 'latitud y longitud son requeridos'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar si ya existe una ubicación para este usuario
            try:
                ubicacion = UbicacionRepartidor.objects.get(repartidor=request.user)
                # Actualizar ubicación existente
                ubicacion.latitud = latitud
                ubicacion.longitud = longitud
                ubicacion.save()
                action = "actualizada"
            except UbicacionRepartidor.DoesNotExist:
                # Crear nueva ubicación
                ubicacion = UbicacionRepartidor.objects.create(
                    repartidor=request.user,
                    latitud=latitud,
                    longitud=longitud
                )
                action = "creada"            
            serializer = UbicacionRepartidorSerializer(ubicacion)
            response_data = {
                'message': f'Ubicación {action} exitosamente',
                'data': serializer.data
            }            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"=== ERROR INESPERADO ===")
            print(f"Tipo de error: {type(e).__name__}")
            print(f"Mensaje de error: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            
            return Response({'error': 'Error interno del servidor'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request):
        try:
            # Obtener ubicaciones de los últimos 30 minutos para considerar como activos
            from datetime import timedelta
            limite_tiempo = timezone.now() - timedelta(minutes=30)
            
            ubicaciones = UbicacionRepartidor.objects.filter(
                timestamp__gte=limite_tiempo
            ).select_related('repartidor')
            
            ubicaciones_data = []
            for ubicacion in ubicaciones:
                # Verificar si el usuario tiene un repartidor asociado
                try:
                    repartidor_info = ubicacion.repartidor.repartidor
                    ubicaciones_data.append({
                        'repartidor_id': ubicacion.repartidor.id,
                        'repartidor_nombre': f"{ubicacion.repartidor.first_name} {ubicacion.repartidor.last_name}".strip() or ubicacion.repartidor.email,
                        'latitud': float(ubicacion.latitud),
                        'longitud': float(ubicacion.longitud),
                        'timestamp': ubicacion.timestamp,
                        'activo': True
                    })
                except AttributeError:
                    # Si no tiene repartidor asociado, incluir solo información básica
                    ubicaciones_data.append({
                        'repartidor_id': ubicacion.repartidor.id,
                        'repartidor_nombre': ubicacion.repartidor.email,
                        'latitud': float(ubicacion.latitud),
                        'longitud': float(ubicacion.longitud),
                        'timestamp': ubicacion.timestamp,
                        'activo': True
                    })
            
            return Response({
                'message': 'Ubicaciones obtenidas exitosamente',
                'count': len(ubicaciones_data),
                'data': ubicaciones_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': 'Error al obtener ubicaciones'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)