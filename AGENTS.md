@RTK.md

# Standardization usage

When asked to add or update CI/CD in a client repository:

- Use this repository as the canonical source: `caesariodito/.standardization`
- Read `ci/client-repository-guide.md`
- Prefer thin wrapper workflows in client repos under `.github/workflows/`
- Reference reusable workflows with `@v1`
- Do not copy full reusable workflows into client repos unless explicitly requested
- Use examples from `ci/examples/client-workflows/`
- For Go repos with private Deccara modules, configure:
  - `private_modules_pattern: github.com/deccara-tech/*`
  - `GH_PRIVATE_MODULES_TOKEN` from the consuming repo/org secrets
- Do not store private Deccara tokens in this repository
