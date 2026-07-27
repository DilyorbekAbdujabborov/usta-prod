from django.conf import settings
from django.views.static import serve


def serve_media_cached(request, path):
    """Wraps Django's static serve (which already streams via FileResponse/
    wsgi.file_wrapper) to add a long-lived Cache-Control header. Safe to
    cache aggressively because every upload gets a fresh random uuid4
    filename (see users/views.py's profile_upload_view) - a given URL's
    content never changes, so there's no staleness risk."""
    response = serve(request, path, document_root=settings.MEDIA_ROOT)
    response['Cache-Control'] = 'public, max-age=31536000, immutable'
    return response
