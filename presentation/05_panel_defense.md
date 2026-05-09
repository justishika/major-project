# Panel Defense Guide — Tough Questions and Real Answers

The panel will target the weakest points. Do not bluff. Real answers win.

---

## ATTACK 1: "Your quantum model doesn't consistently beat classical models. What's the point?"
**Your answer:**
> "That's the central finding, not a failure. We are in the NISQ era. Our study shows that standalone quantum models are significantly more noise-sensitive and have higher variance. However, our Hybrid Stacking Ensemble successfully extracts the unique quantum feature interactions, combining them with robust classical models to achieve state-of-the-art results across 12 distinct datasets. We've proven quantum value in an ensemble setting."

## ATTACK 2: "You're simulating a quantum computer. This proves nothing about hardware."
**Your answer:**
> "We explicitly inject depolarizing noise based on IBM hardware calibration (1-5% error rates). Simulating 12 datasets across multiple runs requires tens of thousands of circuit evaluations, which would take months in real IBM Q queues. Simulation with realistic noise is the standard approach in current QML research."

## ATTACK 3: "4 qubits is trivially small."
**Your answer:**
> "4 qubits is a deliberate design choice forced by simulation constraints, but it directly maps to our 4 PCA components. Even in this 16-dimensional Hilbert space, the quantum kernel generates different decision boundaries from the classical RBF kernel. Scaling to more qubits is computationally intractable for this many experiments but is a natural future extension."

## ATTACK 4: "The Hybrid model is mostly classical."
**Your answer:**
> "Yes, the Hybrid model uses a stacking ensemble of Random Forest, Extra Trees, Gradient Boosting, and QK-SVM. The key is **error decorrelation**. The classical models use decision trees, while the quantum model uses kernel feature geometries. Because they make errors on different samples, the meta-learner achieves higher accuracy than any single model could alone."

## ATTACK 5: "Your datasets are too small."
**Your answer:**
> "Medical datasets are inherently small due to privacy constraints and rarity (e.g., Wilson's Disease or ALS). That is exactly the regime we are benchmarking. We proved generalizability by running our pipeline on 12 independent clinical datasets rather than just one."

## ATTACK 6: "No doctor would use this today."
**Your answer:**
> "Correct. We explicitly argue that NISQ-era quantum models are too unstable for direct clinical deployment. However, our Hybrid ensemble architecture shows a pragmatic path forward: using quantum models as *base learners* rather than standalone diagnostic tools."
