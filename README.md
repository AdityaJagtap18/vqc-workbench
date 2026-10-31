# VQC Workbench

A standalone research workbench for Variational Quantum Classifiers (VQC):
configure a quantum feature map + trainable ansatz, train it with a
classical optimizer against real objective-value feedback, and compare it
against classical baselines (Logistic Regression, MLP, RBF SVM, Random
Forest) on identical data.

This is Experiment 2 — a self-contained project with no dependency on
QuantumCloud, `quantum-circuit-visualizer`, `quantum-kernel-benchmark`, or
the Experiment 1 app (`qml-kernel-workbench`).

See [docs/VQC_IMPLEMENTATION_PLAN.md](docs/VQC_IMPLEMENTATION_PLAN.md) for
the full implementation plan, the installed package versions, and the
Qiskit Machine Learning APIs as verified against this environment.

## Running locally

Backend:

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server (port 5174) proxies `/api` to `http://127.0.0.1:8001`.

## Tests

```bash
cd backend
source .venv/bin/activate
pytest
```
