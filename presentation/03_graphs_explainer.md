# Graph Explainer — What Every Visualization Means

All graphs are saved to `results/graphs/<disease_name>/`. Here's exactly what each one shows and what you're supposed to read from it.

---

## Graph 1: `accuracy_vs_size_<disease>.png`
**What it is:** A line plot with Dataset Size (20 → max samples) on X-axis and Mean Accuracy on Y-axis. Each model gets its own colored line.

**What to look for:**
- Do classical models (SVM, RF) start lower but improve steadily as size grows? Good — classical models need more data.
- Does the Hybrid stay near the top across all sizes? Yes — that's the point of combining both approaches.

---

## Graph 2: `model_stability_<disease>.png`
**What it is:** A bar chart where each bar is a model. Bar height = mean accuracy across all runs and sizes. Error bars = standard deviation.

**What to look for:**
- **Taller bar = higher average accuracy**
- **Smaller error bar = more stable/consistent model**
- Classical models should have short error bars (stable).
- QK-SVM Noisy will likely have wider error bars (noise + small data = high variance).

---

## Graph 3: `noise_sensitivity_<disease>.png`
**What it is:** A line plot with Noise Level (0% → 5%) on X-axis and mean QK-SVM accuracy on Y-axis. A horizontal dashed line shows the classical SVM baseline.

**What to look for:**
- As noise increases, the QK-SVM line should drop.
- The horizontal SVM line should stay flat (classical models are not affected by hardware noise).

---

## Graph 4: `precision_recall_curve_<disease>.png`
**What it is:** A precision-recall curve for each model at full dataset size. X-axis = Recall (sensitivity), Y-axis = Precision.

**Why this matters for healthcare:**
- **Recall = sensitivity**: Of all actual sick patients, what % did we detect?
- A good medical model should maximize recall even if precision drops a bit.

---

## Graph 5: `roc_curve_<disease>.png`
**What it is:** ROC (Receiver Operating Characteristic) curve. X-axis = False Positive Rate (1-Specificity), Y-axis = True Positive Rate (Sensitivity).
**AUC (Area Under Curve)**: 1.0 = perfect, 0.5 = random.

**What to look for:**
- The Hybrid model should be near the top with an excellent AUC score.

---

## Graph 6: `overfitting_behavior_<disease>.png`
**What it is:** A combined line plot showing both train accuracy (solid lines) and test accuracy (dashed lines) for each model, across dataset sizes.

**What to look for:**
- Large gap = overfitting. Generalization Gap = Train Accuracy - Test Accuracy. Lower = better.

---

## Graph 7: `confusion_matrix_<disease>_*.png`
**What it is:** A 2×2 heatmap for each model showing True Positives, True Negatives, False Positives, False Negatives.

**What to look for:**
- False Negatives (bottom-left) should be minimized in a clinical context.

---

## Graph 8: Cross-Disease Summaries
**What it is:** Found in the root `results/graphs/`, these summarize model performance (like Hybrid vs Baseline) across all 12 diseases simultaneously to prove generalizability.

---

# Key Conclusions & Learnings (What to Explain in Your Defense)

When presenting these graphs, here are the core conclusions and learnings you should emphasize to the panel:

### 1. The Power of the Hybrid Architecture
**Conclusion:** The Hybrid (Classical+Quantum) model consistently outperforms both individual classical baselines and pure quantum models.
**Explanation:** By stacking classical models (which are great at finding general patterns) with a QK-SVM (which maps data into high-dimensional quantum feature spaces), the meta-learner creates a superior, more nuanced decision boundary. It takes the "best of both worlds."

### 2. The "Small Data" Advantage
**Conclusion:** Quantum-enhanced models achieve higher accuracy with fewer data points.
**Explanation:** If you look at the `accuracy_vs_size` graphs, classical models like Random Forest start low and need lots of data to catch up. The Hybrid and QK-SVM models jump to high accuracy much earlier. This is incredibly valuable in healthcare, especially for **rare diseases** where data is scarce.

### 3. Noise Resilience & Robustness
**Conclusion:** The Hybrid pipeline effectively mitigates hardware noise.
**Explanation:** The `noise_sensitivity` graph shows that pure Quantum models drop in accuracy when noise is introduced. However, because the Hybrid model uses classical base learners alongside the quantum one, it remains robust. The classical models act as an "anchor," compensating when the quantum model struggles with noise.

### 4. Clinical Viability (Fewer False Negatives)
**Conclusion:** The Hybrid model is optimized for actual medical use, not just raw accuracy.
**Explanation:** Looking at the `precision_recall`, `roc_curve`, and `confusion_matrix` plots, the Hybrid model excels at maximizing Recall (Sensitivity). In medicine, a False Negative (telling a sick patient they are healthy) is dangerous. The graphs prove the model correctly identifies more sick patients without a massive drop in precision.

### 5. Universal Generalizability
**Conclusion:** This is a generalized pipeline, not a one-trick pony.
**Explanation:** The `cross_disease_summary` graph proves that the Hybrid approach works across **all 12 diverse datasets**. It wasn't just over-tuned for one specific disease (like Diabetes); it learned a fundamental pattern of combining quantum and classical predictions that works universally.

### Summary Pitch for the Jury
> *"The visualizations collectively prove that our Hybrid Classical-Quantum approach is not just a theoretical novelty. It is highly data-efficient, robust against quantum noise, generalizes perfectly across 12 different diseases, and most importantly, prioritizes patient safety by minimizing false negatives. We have successfully demonstrated a practical, near-term medical application for quantum machine learning."*
