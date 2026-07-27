from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count, Case, When, IntegerField
from .models import Master
from .serializers import MasterSerializer, MasterCreateSerializer


def _is_admin_user(request):
    return bool(request.user.is_authenticated and getattr(request.user, 'is_admin', False))


@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@permission_classes([permissions.AllowAny])
def masters_view(request):
    if request.method == 'GET':
        master_id = request.GET.get('id')
        if master_id:
            try:
                master = Master.objects.get(pk=master_id, is_deleted=False)
                serializer = MasterSerializer(master)
                return Response(serializer.data)
            except Master.DoesNotExist:
                return Response({'error': 'Topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        qs = Master.objects.filter(is_active=True, is_deleted=False).select_related('category_id')
        category = request.GET.get('category')
        region = request.GET.get('region')
        district = request.GET.get('district')
        q = request.GET.get('q')
        sort_by = request.GET.get('sortBy', '')
        sort_dir = request.GET.get('sortDir', 'desc')

        if category:
            qs = qs.filter(category_id=category)
        if region:
            qs = qs.filter(region__icontains=region)
        if district:
            qs = qs.filter(district__icontains=district)
        if q:
            qs = qs.filter(
                Q(user__name__icontains=q) |
                Q(bio__icontains=q) |
                Q(services__icontains=q) |
                Q(specialty__icontains=q)
            )

        if sort_by == 'jobs':
            # completed_jobs isn't a stored column anymore (see
            # MasterSerializer) - annotate it the same way for sorting.
            qs = qs.annotate(
                jobs_count=Count(Case(
                    When(orders__status='completed', then=1),
                    output_field=IntegerField(),
                ))
            ).order_by('-jobs_count' if sort_dir == 'desc' else 'jobs_count')
        else:
            sort_map = {
                'price': 'price',
                'experience': 'experience',
                'rating': 'rating',
            }
            sort_field = sort_map.get(sort_by, 'created_at')
            if sort_dir == 'desc':
                sort_field = '-' + sort_field
            qs = qs.order_by(sort_field)

        try:
            page = int(request.GET.get('page', 1))
            limit = int(request.GET.get('limit', 20))
        except ValueError:
            page, limit = 1, 20
        start = (page - 1) * limit
        end = page * limit
        total = qs.count()
        qs = qs[start:end]

        serializer = MasterSerializer(qs, many=True)
        return Response({'data': serializer.data, 'total': total})

    if request.method == 'POST':
        if not _is_admin_user(request):
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        serializer = MasterCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        master = serializer.save()
        return Response(MasterSerializer(master).data, status=status.HTTP_201_CREATED)

    if request.method == 'PATCH':
        master_id = request.GET.get('id')
        if not master_id:
            return Response({'error': 'id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            master = Master.objects.get(pk=master_id)
        except Master.DoesNotExist:
            return Response({'error': 'Topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        is_admin = _is_admin_user(request)
        # A master must be able to edit their own Workspace profile - this
        # used to be admin-only, which meant every self-edit 403'd.
        is_self = request.user.is_authenticated and master.user_id == request.user.id
        if not (is_admin or is_self):
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)

        if 'addRating' in request.data:
            if not is_admin:
                return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
            try:
                add_rating = int(request.data.get('addRating'))
            except (TypeError, ValueError):
                return Response({'error': "Baho noto'g'ri formatda"}, status=status.HTTP_400_BAD_REQUEST)
            if not (1 <= add_rating <= 5):
                return Response({'error': "Baho 1 dan 5 gacha bo'lishi kerak"}, status=status.HTTP_400_BAD_REQUEST)
            from django.db import transaction
            with transaction.atomic():
                master = Master.objects.select_for_update().get(pk=master_id)
                total = master.rating * master.reviews_count + add_rating
                master.reviews_count += 1
                master.rating = round(total / master.reviews_count, 2)
                master.save(update_fields=['rating', 'reviews_count'])
            return Response(MasterSerializer(master).data)

        data = request.data
        if not is_admin:
            # verified/premiumUntil are payment- and admin-gated, rating/
            # reviewsCount/completedJobs/monthlyEarnings are computed
            # server-side - a master editing their own profile can't slip
            # those in through a self-PATCH.
            SELF_EDITABLE_FIELDS = {
                'categoryId', 'name', 'phone', 'avatarUrl', 'bio', 'extraPhone',
                'telegram', 'specialty', 'priceComment', 'services', 'experience',
                'price', 'region', 'district', 'isActive',
            }
            data = {k: v for k, v in request.data.items() if k in SELF_EDITABLE_FIELDS}

        serializer = MasterSerializer(master, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    if request.method == 'DELETE':
        if not _is_admin_user(request):
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        master_id = request.GET.get('id')
        if not master_id:
            return Response({'error': 'id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            master = Master.objects.get(pk=master_id)
        except Master.DoesNotExist:
            return Response({'error': 'Topilmadi'}, status=status.HTTP_404_NOT_FOUND)
        from orders.models import Order
        from payments.models import Payment
        if Order.objects.filter(master=master).exists() or Payment.objects.filter(master=master).exists():
            return Response({'error': "Ushbu ustaga bog'liq buyurtmalar yoki to'lovlar mavjud, o'chirib bo'lmadi"}, status=status.HTTP_409_CONFLICT)
        master.is_deleted = True
        master.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
