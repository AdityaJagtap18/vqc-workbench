from app.schemas.vqc import AnsatzConfig, FeatureMapConfig
from app.services import ansatz_service, feature_map_service


def test_real_amplitudes_parameter_count_is_trainable_only():
    config = AnsatzConfig(ansatz="RealAmplitudes", reps=1, entanglement="linear")
    circuit = ansatz_service.build_ansatz(config, n_qubits=2)
    # RealAmplitudes(reps=1) on 2 qubits: (reps+1) rotation layers of 1 param each.
    assert circuit.num_parameters == 4


def test_efficient_su2_builds():
    config = AnsatzConfig(ansatz="EfficientSU2", reps=1, entanglement="linear")
    circuit = ansatz_service.build_ansatz(config, n_qubits=2)
    assert circuit.num_qubits == 2
    assert circuit.num_parameters > 0


def test_combined_circuit_separates_encoding_from_trainable_params():
    fm_config = FeatureMapConfig(feature_map="ZZFeatureMap", n_qubits=2, reps=1, entanglement="linear")
    fm = feature_map_service.build_feature_map(fm_config)
    ansatz_config = AnsatzConfig(ansatz="RealAmplitudes", reps=1, entanglement="linear")
    ansatz = ansatz_service.build_ansatz(ansatz_config, n_qubits=2)

    combined = ansatz_service.build_combined_circuit(fm, ansatz)

    assert combined.num_parameters == fm.num_parameters + ansatz.num_parameters
    assert fm.num_parameters == 2  # one encoding parameter per qubit for ZZFeatureMap reps=1
    assert ansatz.num_parameters == 4
