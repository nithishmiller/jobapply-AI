# JobApply AI — Security

## 1. Security Principles

- Treat all user-provided data as untrusted.
- Keep secrets and credentials server-side.
- Minimize stored personal data.
- Validate all external input.
- Prefer secure defaults.
- Do not introduce unnecessary infrastructure or attack surface.

## 2. Authentication

- Authentication must be handled server-side.
- Sessions or tokens must be stored and transmitted securely.
- Never expose private credentials to the frontend.
- Implement authorization checks for protected resources.

## 3. File Uploads

CV uploads must be validated for:

- File type.
- File size.
- File extension.
- Content where appropriate.

Uploaded files must not be executed.

Temporary files should be removed when no longer required.

## 4. API Security

- Validate request bodies and parameters.
- Return safe error messages.
- Do not expose stack traces in production.
- Apply rate limiting where appropriate.
- Protect sensitive endpoints.
- Configure CORS explicitly.

## 5. Database Security

- Use parameterized queries or ORM protections.
- Never construct SQL from untrusted input.
- Keep database credentials outside source control.
- Use least-privilege database access.

## 6. AI Provider Security

- AI provider API keys must remain server-side.
- Never commit API keys to Git.
- Do not send unnecessary personal information to AI providers.
- Validate AI-generated output before using it in application workflows.
- AI must not fabricate candidate qualifications or experience.

## 7. Frontend Security

- Avoid unsafe HTML rendering.
- Sanitize untrusted content where required.
- Do not store server secrets in frontend code.
- Keep dependencies updated.
- Avoid unnecessary third-party scripts.

## 8. Environment Variables

Secrets must be stored through environment configuration.

Examples:

- Database credentials.
- AI provider credentials.
- Authentication secrets.
- Deployment credentials.

Never commit `.env` files containing secrets.

## 9. Git Security

Before committing:

- Check for secrets.
- Check for credentials.
- Check for private files.
- Check generated files and build output.

Use `.gitignore` for:

- `.env`
- `.env.*`
- `node_modules/`
- `dist/`
- Python virtual environments
- Local databases
- Temporary files

## 10. Security Testing

Before production:

- Run dependency/security checks.
- Test authentication and authorization.
- Test file-upload validation.
- Test API input validation.
- Review exposed endpoints.
- Run Strix after meaningful features are implemented.

## 11. Incident Principle

If a secret is accidentally exposed:

1. Revoke or rotate it immediately.
2. Remove it from active source files.
3. Review Git history where applicable.
4. Investigate affected systems.
5. Replace the credential with a new one.

Security issues should be fixed at the source rather than hidden.
