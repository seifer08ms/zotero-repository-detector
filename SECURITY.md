# Security

Repository Detector only needs public repository metadata and public archive downloads for its default workflow.

Do not report private credentials in public issues. If a security problem could expose user data, open a private security advisory in the GitHub repository instead of filing a public issue.

Third-party GitHub and Hugging Face mirrors are fallback endpoints for public resources only. The plugin does not intentionally forward account credentials or authorization headers to those mirrors.
