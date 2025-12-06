from fastapi import APIRouter, Depends
from app.schemas.issue_schema import IssueCreate
from app.services.issue_service import submit_issue, list_issues, resolve_issue
from app.utils.admin_authenticate import admin_auth

router = APIRouter(prefix="/admin/issues", tags=["Issue Management"])

@router.get("/")
async def get_all(admin = Depends(admin_auth)):
    return await list_issues()

@router.put("/{issue_id}/resolve")
async def mark_resolved(issue_id: str, admin = Depends(admin_auth)):
    return await resolve_issue(issue_id)
