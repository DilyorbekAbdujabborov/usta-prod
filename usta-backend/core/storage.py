from whitenoise.storage import CompressedManifestStaticFilesStorage


class LenientManifestStaticFilesStorage(CompressedManifestStaticFilesStorage):
    """django-jazzmin's admin/base.html calls {% static 'vendor/bootswatch' %}
    unconditionally (as a JS data-attribute directory marker, not an actual
    file to fetch) regardless of show_theme_chooser. Manifest-strict storage
    treats any {% static %} argument without a matching collected file as a
    hard error, which 500s every single admin page. manifest_strict = False
    makes it fall back to the plain (unhashed) path for just that one
    lookup instead, while every real static file still gets a hashed,
    cache-busted name as normal."""
    manifest_strict = False
