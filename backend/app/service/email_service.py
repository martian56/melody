import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime, timedelta
from uuid import UUID
import logging

from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.models.order import Order

logger = logging.getLogger(__name__)

class EmailService:
    @classmethod
    def _send_email(cls, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send email using Gmail SMTP"""
        if not settings.EMAIL_SENDER or not settings.APP_PASSWORD:
            logger.warning("Email configuration not set. Email not sent.")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg["From"] = settings.EMAIL_SENDER
            msg["To"] = to_email
            msg["Subject"] = subject
            
            # Add text and HTML parts
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email using Gmail SMTP
            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.starttls()
                server.login(settings.EMAIL_SENDER, settings.APP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}", exc_info=True)
            return False
    
    @classmethod
    def send_email(cls, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send email (public method)"""
        return cls._send_email(to_email, subject, html_content, text_content)
    
    @classmethod
    def _get_email_template_base(cls, title: str, content: str) -> str:
        """Base HTML template for emails"""
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #e0e7ff 100%);">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #e0e7ff 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); padding: 40px 30px; text-align: center;">
                            <div style="display: inline-block; width: 60px; height: 60px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 32px; color: #ffffff;">✨</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Melody</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            {content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                &copy; {datetime.now().year} Melody. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                                Your trusted beauty destination for makeup, skincare, and haircare products.
                            </p>
                            <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 12px;">
                                Baku, Azerbaijan | <a href="mailto:support@melody.az" style="color: #ec4899; text-decoration: none;">support@melody.az</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    
    @classmethod
    def send_welcome_email(cls, user: User) -> bool:
        """Send welcome email after registration"""
        first_name = user.first_name or "there"
        
        content = f"""
            <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">Welcome to Melody! 🎉</h2>
            
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi {first_name},
            </p>
            
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                We're thrilled to have you join the Melody family! You've just taken the first step towards discovering 
                premium beauty products curated just for you.
            </p>
            
            <div style="background: linear-gradient(135deg, #fce7f3 0%, #f3e8ff 100%); border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; color: #111827; font-size: 16px; font-weight: 600;">What's next?</p>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
                    <li>Browse our curated collection of beauty products</li>
                    <li>Create your wishlist and save your favorites</li>
                    <li>Enjoy free shipping on orders over $50</li>
                    <li>Get exclusive access to new arrivals and special offers</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.FRONTEND_URL or 'http://localhost:5173'}/products" 
                   style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(236, 72, 153, 0.3);">
                    Start Shopping
                </a>
            </div>
            
            <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you have any questions, feel free to reach out to us at 
                <a href="mailto:support@melody.az" style="color: #ec4899; text-decoration: none;">support@melody.az</a>
            </p>
        """
        
        html_content = cls._get_email_template_base("Welcome to Melody!", content)
        
        text_content = f"""
Welcome to Melody!

Hi {first_name},

We're thrilled to have you join the Melody family! You've just taken the first step towards discovering premium beauty products curated just for you.

What's next?
- Browse our curated collection of beauty products
- Create your wishlist and save your favorites
- Enjoy free shipping on orders over $50
- Get exclusive access to new arrivals and special offers

Start shopping: {settings.FRONTEND_URL or 'http://localhost:5173'}/products

If you have any questions, feel free to reach out to us at support@melody.az

© {datetime.now().year} Melody. All rights reserved.
"""
        
        return cls._send_email(
            to_email=user.email,
            subject="Welcome to Melody! 🎉",
            html_content=html_content,
            text_content=text_content
        )
    
    @classmethod
    def send_login_email(cls, user: User) -> bool:
        """Send welcome back email after login"""
        first_name = user.first_name or "there"
        
        content = f"""
            <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">Welcome Back! 👋</h2>
            
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi {first_name},
            </p>
            
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                We noticed you just logged into your Melody account. We're glad to have you back!
            </p>
            
            <div style="background: linear-gradient(135deg, #fce7f3 0%, #f3e8ff 100%); border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; color: #111827; font-size: 16px; font-weight: 600;">Quick Access</p>
                <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.8;">
                    Continue shopping, check your orders, or explore new arrivals.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.FRONTEND_URL or 'http://localhost:5173'}/products" 
                   style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(236, 72, 153, 0.3);">
                    Continue Shopping
                </a>
            </div>
            
            <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                If this wasn't you, please <a href="mailto:support@melody.az" style="color: #ec4899; text-decoration: none;">contact us</a> immediately.
            </p>
        """
        
        html_content = cls._get_email_template_base("Welcome Back to Melody", content)
        
        text_content = f"""
Welcome Back!

Hi {first_name},

We noticed you just logged into your Melody account. We're glad to have you back!

Continue shopping: {settings.FRONTEND_URL or 'http://localhost:5173'}/products

If this wasn't you, please contact us immediately at support@melody.az

© {datetime.now().year} Melody. All rights reserved.
"""
        
        return cls._send_email(
            to_email=user.email,
            subject="Welcome Back to Melody! 👋",
            html_content=html_content,
            text_content=text_content
        )
    
    @classmethod
    def send_order_status_email(cls, order: Order) -> bool:
        """Send email when order status changes"""
        customer_name = f"{order.customer_first_name} {order.customer_last_name}".strip() or "Valued Customer"
        
        # Get status color and message
        status_info = {
            "pending": {"color": "#f59e0b", "icon": "⏳", "title": "Order Received", "message": "We've received your order and are preparing it for processing."},
            "processing": {"color": "#3b82f6", "icon": "🔄", "title": "Order Processing", "message": "Your order is being processed and will be shipped soon."},
            "shipped": {"color": "#8b5cf6", "icon": "📦", "title": "Order Shipped", "message": "Great news! Your order has been shipped and is on its way to you."},
            "delivered": {"color": "#10b981", "icon": "✅", "title": "Order Delivered", "message": "Your order has been delivered! We hope you love your new products."},
            "cancelled": {"color": "#ef4444", "icon": "❌", "title": "Order Cancelled", "message": "Your order has been cancelled. If you have any questions, please contact us."},
            "refunded": {"color": "#6366f1", "icon": "💰", "title": "Order Refunded", "message": "Your order has been refunded. The amount will be processed back to your payment method."},
        }
        
        status = order.status.value if hasattr(order.status, 'value') else str(order.status)
        info = status_info.get(status.lower(), {"color": "#6b7280", "icon": "📋", "title": "Order Update", "message": "Your order status has been updated."})
        
        # Format order items
        items_html = ""
        if order.items:
            for item in order.items:
                items_html += f"""
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #111827; font-weight: 600; font-size: 15px;">{item.product_name}</p>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Quantity: {item.quantity} × ${item.unit_price:.2f}</p>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                        <p style="margin: 0; color: #111827; font-weight: 600; font-size: 15px;">${item.total_price:.2f}</p>
                    </td>
                </tr>
                """
        
        content = f"""
            <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                {info['icon']} {info['title']}
            </h2>
            
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi {customer_name},
            </p>
            
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                {info['message']}
            </p>
            
            <div style="background: linear-gradient(135deg, #fce7f3 0%, #f3e8ff 100%); border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid {info['color']};">
                <p style="margin: 0 0 10px 0; color: #111827; font-size: 16px; font-weight: 600;">Order Details</p>
                <p style="margin: 5px 0; color: #374151; font-size: 15px;"><strong>Order Number:</strong> {order.order_number}</p>
                <p style="margin: 5px 0; color: #374151; font-size: 15px;"><strong>Status:</strong> <span style="color: {info['color']}; font-weight: 600; text-transform: capitalize;">{status.replace('_', ' ')}</span></p>
                <p style="margin: 5px 0; color: #374151; font-size: 15px;"><strong>Date:</strong> {order.created_at.strftime('%B %d, %Y at %I:%M %p')}</p>
            </div>
            
            {f'''
            <div style="margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px; overflow: hidden;">
                    {items_html}
                </table>
            </div>
            ''' if items_html else ''}
            
            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #374151; font-size: 15px;">Subtotal:</td>
                        <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 15px; font-weight: 600;">${order.subtotal:.2f}</td>
                    </tr>
                    {f'<tr><td style="padding: 8px 0; color: #374151; font-size: 15px;">Tax:</td><td style="padding: 8px 0; text-align: right; color: #111827; font-size: 15px; font-weight: 600;">${order.tax:.2f}</td></tr>' if order.tax else ''}
                    {f'<tr><td style="padding: 8px 0; color: #374151; font-size: 15px;">Shipping:</td><td style="padding: 8px 0; text-align: right; color: #111827; font-size: 15px; font-weight: 600;">${order.shipping:.2f}</td></tr>' if order.shipping else ''}
                    {f'<tr><td style="padding: 8px 0; color: #374151; font-size: 15px;">Discount:</td><td style="padding: 8px 0; text-align: right; color: #10b981; font-size: 15px; font-weight: 600;">-${order.discount:.2f}</td></tr>' if order.discount else ''}
                    <tr>
                        <td style="padding: 12px 0; border-top: 2px solid #e5e7eb; color: #111827; font-size: 18px; font-weight: 700;">Total:</td>
                        <td style="padding: 12px 0; border-top: 2px solid #e5e7eb; text-align: right; color: #ec4899; font-size: 18px; font-weight: 700;">${order.total:.2f}</td>
                    </tr>
                </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.FRONTEND_URL or 'http://localhost:5173'}/orders/{order.id}" 
                   style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(236, 72, 153, 0.3);">
                    View Order Details
                </a>
            </div>
            
            <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you have any questions about your order, feel free to reach out to us at 
                <a href="mailto:support@melody.az" style="color: #ec4899; text-decoration: none;">support@melody.az</a>
            </p>
        """
        
        html_content = cls._get_email_template_base(f"Order {info['title']}", content)
        
        text_content = f"""
{info['title']}

Hi {customer_name},

{info['message']}

Order Details:
- Order Number: {order.order_number}
- Status: {status.replace('_', ' ')}
- Date: {order.created_at.strftime('%B %d, %Y at %I:%M %p')}

Total: ${order.total:.2f}

View your order: {settings.FRONTEND_URL or 'http://localhost:5173'}/orders/{order.id}

If you have any questions, contact us at support@melody.az

© {datetime.now().year} Melody. All rights reserved.
"""
        
        return cls._send_email(
            to_email=order.customer_email,
            subject=f"Order {info['title']} - {order.order_number}",
            html_content=html_content,
            text_content=text_content
        )
    
    @classmethod
    def send_verification_email(cls, user: User, verification_token: str) -> bool:
        """Send email verification email"""
        verification_url = f"{settings.FRONTEND_URL or 'http://localhost:5173'}/verify-email?token={verification_token}"
        first_name = user.first_name or "there"
        
        content = f"""
            <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">Verify Your Email ✉️</h2>
            
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi {first_name},
            </p>
            
            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for signing up! Please verify your email address to complete your registration and unlock all features.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_url}" 
                   style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(236, 72, 153, 0.3);">
                    Verify Email Address
                </a>
            </div>
            
            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
            </p>
            <p style="margin: 10px 0 0 0; color: #ec4899; font-size: 14px; word-break: break-all;">
                {verification_url}
            </p>
            
            <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                This link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
        """
        
        html_content = cls._get_email_template_base("Verify Your Email", content)
        
        text_content = f"""
Verify Your Email

Hi {first_name},

Thank you for signing up! Please verify your email address to complete your registration.

Visit this link to verify: {verification_url}

This link will expire in 24 hours. If you didn't create an account, please ignore this email.

© {datetime.now().year} Melody. All rights reserved.
"""
        
        return cls._send_email(
            to_email=user.email,
            subject="Verify Your Email - Melody",
            html_content=html_content,
            text_content=text_content
        )
    
    @classmethod
    def generate_verification_token(cls, user_id: UUID) -> str:
        """Generate email verification token"""
        return create_access_token(
            data={"sub": str(user_id), "type": "email_verification"},
            expires_delta=timedelta(hours=24)
        )
    
    @classmethod
    def generate_password_reset_token(cls, user_id: UUID) -> str:
        """Generate password reset token"""
        return create_access_token(
            data={"sub": str(user_id), "type": "password_reset"},
            expires_delta=timedelta(hours=1)
        )
