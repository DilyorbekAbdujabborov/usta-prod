from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Category


def _is_admin(request):
    return bool(request.user.is_authenticated and getattr(request.user, 'is_admin', False))


def _serialize(c):
    return {
        'id': c.id,
        'name': c.name,
        'color': c.color,
        'image': c.image,
        'sortOrder': c.sort_order,
        'isActive': c.is_active,
    }


@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@permission_classes([permissions.AllowAny])
def categories_list_view(request):
    if request.method == 'GET':
        if request.GET.get('all') == '1' and _is_admin(request):
            qs = Category.objects.all().order_by('sort_order', 'id')
        else:
            qs = Category.objects.filter(is_active=True).order_by('sort_order', 'id')
        return Response([_serialize(c) for c in qs])

    if request.method == 'POST':
        if not _is_admin(request):
            return Response({'error': "Ruxsat yo'q"}, status=status.HTTP_403_FORBIDDEN)
        cat_id = request.data.get('id')
        name = request.data.get('name')
        if not cat_id or not name:
            return Response({'error': 'id va name talab qilinadi'}, status=status.HTTP_400_BAD_REQUEST)
        if Category.objects.filter(pk=cat_id).exists():
            return Response({'error': "Bu id bilan kategoriya allaqachon mavjud"}, status=status.HTTP_409_CONFLICT)
        category = Category.objects.create(
            id=cat_id,
            name=name,
            color=request.data.get('color', ''),
            image=request.data.get('image') or None,
            sort_order=request.data.get('sortOrder', 0),
            is_active=request.data.get('isActive', True),
        )
        return Response(_serialize(category), status=status.HTTP_201_CREATED)

    if request.method == 'PATCH':
        if not _is_admin(request):
            return Response({'error': "Ruxsat yo'q"}, status=status.HTTP_403_FORBIDDEN)
        cat_id = request.GET.get('id')
        category = get_object_or_404(Category, pk=cat_id)
        for field, key in (('name', 'name'), ('color', 'color'), ('image', 'image'), ('sort_order', 'sortOrder'), ('is_active', 'isActive')):
            if key in request.data:
                setattr(category, field, request.data[key])
        category.save()
        return Response(_serialize(category))

    if request.method == 'DELETE':
        if not _is_admin(request):
            return Response({'error': "Ruxsat yo'q"}, status=status.HTTP_403_FORBIDDEN)
        cat_id = request.GET.get('id')
        category = get_object_or_404(Category, pk=cat_id)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
