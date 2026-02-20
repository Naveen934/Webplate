import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
import io
import urllib.parse


RECEIVER_UPI_ID = "naveen1998726-1@okicici"
RECEIVER_NAME = "Naveen"


def build_upi_uri(amount: float, note: str, transaction_id: str) -> str:
    """
    Constructs a standard UPI payment URI.
    Format: upi://pay?pa=<VPA>&pn=<Name>&am=<Amount>&cu=INR&tn=<Note>&tr=<TxnRef>
    """
    params = {
        "pa": RECEIVER_UPI_ID,
        "pn": RECEIVER_NAME,
        "am": f"{amount:.2f}",
        "cu": "INR",
        "tn": note,
        "tr": transaction_id,
    }
    query_string = urllib.parse.urlencode(params)
    return f"upi://pay?{query_string}"


def build_gpay_intent_url(upi_uri: str) -> str:
    """
    Builds a Google Pay specific intent URL for Android deep linking.
    """
    encoded_uri = urllib.parse.quote(upi_uri, safe="")
    return f"intent://pay?{upi_uri.split('?')[1]}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end"


def generate_qr_code_bytes(upi_uri: str) -> bytes:
    """
    Generates a styled QR code image from a UPI URI and returns it as PNG bytes.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(upi_uri)
    qr.make(fit=True)

    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        back_color=(255, 255, 255),
        fill_color=(26, 42, 108),
    )

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()
