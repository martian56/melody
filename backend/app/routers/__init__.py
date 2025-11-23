from .auth import router as auth_router
from .users import router as users_router
from .products import router as products_router
from .categories import router as categories_router
from .brands import router as brands_router
from .attributes import router as attributes_router
from .tags import router as tags_router
from .oauth import router as oauth_router
from .upload import router as upload_router
from .search import router as search_router
from .cart import router as cart_router
from .wishlist import router as wishlist_router
from .orders import router as orders_router

__all__ = [
    "auth_router",
    "users_router",
    "products_router",
    "categories_router",
    "brands_router",
    "attributes_router",
    "tags_router",
    "oauth_router",
    "upload_router",
    "search_router",
    "cart_router",
    "wishlist_router",
    "orders_router",
]

