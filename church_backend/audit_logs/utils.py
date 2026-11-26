from .models import AuditLog


def create_audit_log(
    user,
    module,
    action,
    reference="",
    description="",
):

    authenticated = (
        user is not None
        and user.is_authenticated
    )

    return AuditLog.objects.create(

        user=user if authenticated else None,

        username=(
            user.get_username()
            if authenticated
            else "System"
        ),

        module=module,

        action=action,

        reference=str(reference or ""),

        description=description,

    )