import boto3
from botocore.exceptions import ClientError, BotoCoreError
from typing import Optional
import uuid
from pathlib import Path
from datetime import datetime
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class S3Service:
    """Service for handling AWS S3 file operations"""
    
    def __init__(self):
        self.bucket_name = settings.AWS_S3_BUCKET_NAME
        if not self.bucket_name:
            raise ValueError("AWS_S3_BUCKET_NAME must be set in environment variables")
        
        # Initialize S3 client
        s3_config = {
            'region_name': settings.AWS_REGION,
        }
        
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            s3_config['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
            s3_config['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY
        
        if settings.AWS_S3_ENDPOINT_URL:
            s3_config['endpoint_url'] = settings.AWS_S3_ENDPOINT_URL
        
        self.s3_client = boto3.client('s3', **s3_config)
    
    def _get_file_extension(self, filename: str) -> str:
        """Get file extension"""
        return Path(filename).suffix.lower()
    
    def _generate_s3_key(self, folder: str, filename: str) -> str:
        """
        Generate S3 key with organized folder structure
        Structure: melody/{folder}/{year}/{month}/{uuid}.{ext}
        Example: melody/products/2024/11/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
        """
        now = datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        
        file_ext = self._get_file_extension(filename)
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        return f"melody/{folder}/{year}/{month}/{unique_filename}"
    
    def upload_file(
        self,
        file_content: bytes,
        folder: str,
        original_filename: str,
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload file to S3 and return the public URL
        
        Args:
            file_content: File content as bytes
            folder: Folder name (products, categories, brands, users)
            original_filename: Original filename for extension detection
            content_type: MIME type of the file (optional, will be inferred if not provided)
        
        Returns:
            Public URL of the uploaded file
        """
        try:
            s3_key = self._generate_s3_key(folder, original_filename)
            
            # Determine content type if not provided
            if not content_type:
                content_type = self._get_content_type(original_filename)
            
            # Upload to S3
            # Note: If your bucket has ACLs disabled, you may need to remove the ACL parameter
            # and ensure your bucket policy allows public read access
            upload_params = {
                'Bucket': self.bucket_name,
                'Key': s3_key,
                'Body': file_content,
                'ContentType': content_type,
            }
            
            # Add ACL for public read access
            # If your bucket has ACLs disabled, comment out this line
            upload_params['ACL'] = 'public-read'
            
            self.s3_client.put_object(**upload_params)
            
            # Generate public URL
            if settings.AWS_S3_ENDPOINT_URL:
                # Custom endpoint (e.g., DigitalOcean Spaces)
                url = f"{settings.AWS_S3_ENDPOINT_URL}/{self.bucket_name}/{s3_key}"
            else:
                # Standard AWS S3 URL
                url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
            
            logger.info(f"File uploaded to S3: {s3_key}")
            return url
            
        except ClientError as e:
            logger.error(f"Error uploading file to S3: {e}")
            raise Exception(f"Failed to upload file to S3: {str(e)}")
        except BotoCoreError as e:
            logger.error(f"Boto3 error: {e}")
            raise Exception(f"AWS service error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error uploading to S3: {e}")
            raise
    
    def delete_file(self, file_url: str) -> bool:
        """
        Delete file from S3 by URL
        
        Args:
            file_url: Full URL of the file to delete
        
        Returns:
            True if successful, False otherwise
        """
        try:
            if not file_url:
                logger.warning("Empty file URL provided for deletion")
                return False
            
            # Extract S3 key from URL
            s3_key = self._extract_key_from_url(file_url)
            if not s3_key:
                logger.warning(f"Could not extract S3 key from URL: {file_url} (bucket: {self.bucket_name})")
                return False
            
            logger.info(f"Attempting to delete S3 object: bucket={self.bucket_name}, key={s3_key}")
            
            # Delete from S3
            response = self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            logger.info(f"Successfully deleted file from S3: {s3_key} (Response: {response.get('ResponseMetadata', {}).get('HTTPStatusCode', 'unknown')})")
            return True
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            logger.error(f"ClientError deleting file from S3: {error_code} - {error_message} (URL: {file_url}, Key: {s3_key if 's3_key' in locals() else 'N/A'})")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting from S3: {e} (URL: {file_url})", exc_info=True)
            return False
    
    def _extract_key_from_url(self, url: str) -> Optional[str]:
        """
        Extract S3 key from URL
        Handles both standard S3 URLs and custom endpoint URLs
        """
        try:
            if not url:
                return None
            
            # Remove query parameters and fragments
            url = url.split('?')[0].split('#')[0].strip()
            
            # Custom endpoint format: https://endpoint/bucket/key
            if settings.AWS_S3_ENDPOINT_URL:
                endpoint = settings.AWS_S3_ENDPOINT_URL.rstrip('/')
                if endpoint in url:
                    # Remove endpoint URL
                    parts = url.replace(endpoint, "").lstrip("/")
                    # Remove bucket name if present
                    if parts.startswith(f"{self.bucket_name}/"):
                        key = parts.replace(f"{self.bucket_name}/", "", 1)
                        logger.debug(f"Extracted key from custom endpoint: {key}")
                        return key
                    # If bucket name is not in URL, assume the rest is the key
                    if parts:
                        logger.debug(f"Using parts as key (no bucket prefix): {parts}")
                        return parts
            
            # Standard AWS S3 URL format: https://bucket.s3.region.amazonaws.com/key
            # Also handles: https://bucket.s3-region.amazonaws.com/key
            if f"{self.bucket_name}.s3" in url:
                # Format: https://bucket.s3.region.amazonaws.com/key or https://bucket.s3-region.amazonaws.com/key
                if ".amazonaws.com/" in url:
                    key = url.split(".amazonaws.com/")[1]
                    logger.debug(f"Extracted key from S3 URL: {key}")
                    return key
                # Try to extract after bucket.s3 (for other formats)
                parts = url.split(f"{self.bucket_name}.s3", 1)
                if len(parts) > 1 and "/" in parts[1]:
                    # Remove region part and get key
                    key_part = parts[1].split("/", 1)
                    if len(key_part) > 1:
                        key = key_part[1]
                        logger.debug(f"Extracted key from bucket.s3 format: {key}")
                        return key
            
            # Try to extract if URL contains the bucket name directly
            if f"/{self.bucket_name}/" in url:
                key = url.split(f"/{self.bucket_name}/")[1]
                logger.debug(f"Extracted key from bucket path: {key}")
                return key
            
            # If URL doesn't match S3 patterns, log warning
            logger.warning(f"Could not extract S3 key from URL: {url} (bucket: {self.bucket_name})")
            return None
            
        except Exception as e:
            logger.error(f"Error extracting key from URL '{url}': {e}", exc_info=True)
            return None
    
    def _get_content_type(self, filename: str) -> str:
        """Get content type based on file extension"""
        ext = self._get_file_extension(filename).lower()
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
        }
        return content_types.get(ext, 'application/octet-stream')
    
    def file_exists(self, file_url: str) -> bool:
        """
        Check if file exists in S3
        
        Args:
            file_url: Full URL of the file
        
        Returns:
            True if file exists, False otherwise
        """
        try:
            s3_key = self._extract_key_from_url(file_url)
            if not s3_key:
                return False
            
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            logger.error(f"Error checking file existence: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error checking file: {e}")
            return False


# Singleton instance
_s3_service: Optional[S3Service] = None


def get_s3_service() -> S3Service:
    """Get or create S3 service instance"""
    global _s3_service
    if _s3_service is None:
        _s3_service = S3Service()
    return _s3_service

