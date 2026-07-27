from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from categories.models import Category
from .models import EnterpriseOrder
from users.throttling import EnterpriseWriteRateThrottle


def _is_admin(request):
    return bool(request.user.is_authenticated and getattr(request.user, 'is_admin', False))


def _serialize(o):
    return {
        'id': str(o.id),
        'companyName': o.company_name,
        'title': o.title,
        'description': o.description,
        'image': o.image,
        'phone': o.phone,
        'categoryId': o.category_id,
        'categoryName': o.category.name if o.category else None,
        'region': o.region,
        'district': o.district,
        'isActive': o.is_active,
        'createdAt': o.created_at,
    }


# Same normalization the frontend uses (UstaApp.tsx's normalizeUzbek) - region
# and district names get typed with any of the apostrophe variants, so
# "Farg'ona" and "Fargʻona" have to match each other.
_APOSTROPHES = 'ʻʼ`‘’″′‛´'


def _normalize_uz(value):
    out = (value or '').strip()
    for ch in _APOSTROPHES:
        out = out.replace(ch, "'")
    return out.lower()


@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@permission_classes([permissions.AllowAny])
@throttle_classes([EnterpriseWriteRateThrottle])
def enterprise_orders_view(request):
    if request.method == 'GET':
        is_admin = _is_admin(request)
        qs = EnterpriseOrder.objects.select_related('category')
        # Admins get the full list (including unpublished ones) from their
        # panel; everyone else only ever sees published listings.
        if not (is_admin and request.GET.get('all') == '1'):
            qs = qs.filter(is_active=True)

        category = request.GET.get('category')
        if category and category != 'all':
            qs = qs.filter(category_id=category)

        q = (request.GET.get('q') or '').strip()
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(description__icontains=q)
                | Q(company_name__icontains=q)
            )

        rows = list(qs.order_by('-created_at'))

        # Region/district are free-text on both sides, so this is filtered in
        # Python against the normalized form rather than with an ORM lookup.
        region = request.GET.get('region')
        district = request.GET.get('district')
        if region:
            rows = [o for o in rows if not o.region or _normalize_uz(o.region) == _normalize_uz(region)]
        if district:
            rows = [o for o in rows if not o.district or _normalize_uz(o.district) == _normalize_uz(district)]

        return Response([_serialize(o) for o in rows])

    if not _is_admin(request):
        return Response({'error': "Ruxsat yo'q"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'POST':
        company_name = (request.data.get('companyName') or '').strip()
        title = (request.data.get('title') or '').strip()
        description = (request.data.get('description') or '').strip()
        phone = (request.data.get('phone') or '').strip()
        if not company_name or not title or not description or not phone:
            return Response(
                {'error': "Korxona nomi, sarlavha, ma'lumot va telefon talab qilinadi"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        category = None
        category_id = request.data.get('categoryId')
        if category_id and category_id != 'all':
            category = Category.objects.filter(pk=category_id).first()

        order = EnterpriseOrder.objects.create(
            company_name=company_name,
            title=title,
            description=description,
            image=request.data.get('image') or None,
            phone=phone,
            category=category,
            region=request.data.get('region') or '',
            district=request.data.get('district') or '',
            is_active=request.data.get('isActive', True),
        )
        return Response(_serialize(order), status=status.HTTP_201_CREATED)

    order = get_object_or_404(EnterpriseOrder, pk=request.GET.get('id'))

    if request.method == 'PATCH':
        for field, key in (
            ('company_name', 'companyName'),
            ('title', 'title'),
            ('description', 'description'),
            ('image', 'image'),
            ('phone', 'phone'),
            ('region', 'region'),
            ('district', 'district'),
            ('is_active', 'isActive'),
        ):
            if key in request.data:
                setattr(order, field, request.data[key])
        if 'categoryId' in request.data:
            category_id = request.data['categoryId']
            order.category = (
                Category.objects.filter(pk=category_id).first()
                if category_id and category_id != 'all'
                else None
            )
        order.save()
        return Response(_serialize(order))

    order.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
