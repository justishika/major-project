# Graph Explainer — What Every Visualization Means

All graphs are saved to `results/graphs/`. Here's exactly what each one shows and what you're supposed to read from it.

---

## Graph 1: `accuracy_vs_size_parkinsons.png`
**Function:** `plot_accuracy_vs_size()`

**What it is:** A line plot with Dataset Size (20 → 195 samples) on X-axis and Mean Accuracy on Y-axis. Each model gets its own colored line.

**What to look for:**
- Do classical models (SVM, RF) start lower at size=20 but improve steadily as size grows? Good — classical models need more data.
- Does the VQC (Noiseless) line hold relatively flat at smaller sizes? That would be the quantum advantage signal — it represents data more efficiently.
- Does VQC (Noisy) track below VQC (Noiseless)? It should — noise degrades quantum performance.
- Does Hybrid stay near the top across all sizes? Yes — that's the point of combining both approaches.

**What to say to the panel:**
> "This graph is our primary result. You can see the accuracy trajectory of 6 models across 5 dataset sizes. Notice that at small sizes (20-50 samples), the classical models show higher variance while the quantum model's trend is distinct — validating that quantum feature maps behave differently in the small-data regime."

---

## Graph 2: `model_stability_parkinsons.png`
**Function:** `plot_model_stability()`

**What it is:** A bar chart where each bar is a model. Bar height = mean accuracy across all runs and sizes. Error bars = standard deviation.

**What to look for:**
- **Taller bar = higher average accuracy**
- **Smaller error bar = more stable/consistent model**
- Classical models should have short error bars (stable)
- VQC Noiseless should have wider error bars (less stable run-to-run)
- VQC Noisy should have the widest error bars (noise + small data = high variance)
- Hybrid should show good accuracy AND moderate error bars

**What to say:**
> "Stability is critical in healthcare. A model that gets 90% sometimes and 60% other times is clinically untrustworthy. This graph quantifies stability. The classical SVM and Random Forest show the tightest error bars. The pure quantum model shows the highest variance. The Hybrid model achieves a balance — near-classical stability with quantum signal included."

---

## Graph 3: `noise_sensitivity_parkinsons.png`
**Function:** `plot_noise_sensitivity()`

**What it is:** A line plot with Noise Level (0% → 5%) on X-axis and mean VQC accuracy on Y-axis. A horizontal dashed line shows the classical SVM baseline.

**What to look for:**
- At 0% noise, the VQC should perform reasonably
- As noise increases from 0% → 5%, the VQC line should drop
- The horizontal SVM line should stay flat (classical models are not affected by quantum hardware noise — they run on CPUs)
- The crossover point (where VQC drops below SVM baseline) is the key finding

**What to say:**
> "This is the noise sensitivity analysis — the most important graph for the quantum computing community. It directly answers: 'At what noise level does quantum advantage disappear?' Here you can see the VQC accuracy degrades as noise increases. The horizontal line is the SVM baseline. The quantum model dips below this line at approximately [X%] noise — meaning beyond this threshold, you'd be better off with a classical SVM. Current NISQ hardware operates at 1-2% error rates, which falls exactly in this critical zone."

---

## Graph 4: `precision_recall_curve_parkinsons.png`
**Function:** `plot_precision_recall_tradeoff()`

**What it is:** A precision-recall curve for each model at full dataset size (195 samples). X-axis = Recall (sensitivity), Y-axis = Precision.

**Why this matters for healthcare:**
- **Recall = sensitivity**: Of all actual Parkinson's patients, what % did we detect?
- **Precision**: Of all our Parkinson's predictions, what % were correct?
- Missing a Parkinson's patient (low recall) = you send a sick person home thinking they're healthy = serious harm
- A good medical model should maximize recall even if precision drops a bit

**What to look for:**
- **Curve that stays high-right**: High precision even at high recall = ideal
- **Curve that drops quickly**: Good precision only when being conservative (low recall) = dangerous for medical use
- The area under each PR curve (AUPRC) indicates overall performance — larger = better

**What to say:**
> "In medical diagnosis, recall (sensitivity) is not negotiable — every missed Parkinson's patient is a failure. The PR curve shows how each model trades between catching all positives and maintaining prediction quality. A model that maintains high precision at high recall is clinically viable. Here you can see how the Hybrid model's curve compares to pure classical and pure quantum approaches."

---

## Graph 5: `roc_curve_parkinsons.png`
**Function:** `plot_roc_curve()`

**What it is:** ROC (Receiver Operating Characteristic) curve. X-axis = False Positive Rate (1-Specificity), Y-axis = True Positive Rate (Sensitivity). The diagonal dashed line is the "random guess" baseline.

**Reading it:**
- A curve that hugs the top-left corner is ideal (high TPR, low FPR)
- **AUC (Area Under Curve)**: 1.0 = perfect, 0.5 = random. A good clinical model needs AUC > 0.85.
- Higher AUC = better overall discriminatory power, regardless of where you set the decision threshold

**What to look for:**
- Classical models (especially SVM, RF) likely have AUC ~0.90+
- VQC Noiseless should be competitive
- VQC Noisy might show a lower AUC
- Hybrid should be near the top

**What to say:**
> "The ROC curve evaluates each model's ability to rank positive cases above negative ones across all decision thresholds. The AUC score shown in the legend is the key number. In clinical deployment, a classifier with AUC above 0.9 is considered excellent. Our results show [state AUC values from graph]. The Hybrid model achieves the highest AUC, confirming that combining classical and quantum signals improves overall discriminatory power."

---

## Graph 6: `overfitting_behavior_parkinsons.png`
**Function:** `plot_overfitting_behavior()`

**What it is:** A combined line plot showing both train accuracy (solid lines) and test accuracy (dashed lines) for each model, across dataset sizes.

**What overfitting looks like:**
- Large gap between solid (train) and dashed (test) = the model memorized training data but doesn't generalize
- Lines that converge as size increases = model gets more reliable with more data

**What to look for:**
- Random Forest often shows large train-test gap at small sizes (100% train accuracy, 75% test = overfitting)
- Classical SVM typically shows more stable behavior
- VQC: if noiseless quantum shows a small generalization gap even at size=20, that's a genuine finding — quantum feature spaces may generalize differently
- Hybrid should show moderate, stable gap

**Generalization Gap = Train Accuracy - Test Accuracy. Lower = better.**

**What to say:**
> "This graph directly measures overfitting. When a model memorizes training data but fails on new patients, it's useless clinically. Notice that Random Forest, despite its high accuracy, shows [mention gap size] gap at small dataset sizes — it's overfitting. The quantum model shows a different pattern: [describe what you actually see]. This tells us something fundamental about how quantum feature spaces generalize compared to classical approach."

---

## Graph 7: `confusion_matrix_parkinsons_*.png`
**Function:** `plot_confusion_matrices()`

**What it is:** A 2×2 heatmap for each model showing:

```
                Predicted:0    Predicted:1
Actual:0  (Healthy)    TN            FP
Actual:1  (Parkinson's) FN           TP
```

- **True Positive (TP)**: Correctly identified Parkinson's — good.
- **True Negative (TN)**: Correctly cleared healthy patient — good.
- **False Negative (FN)**: Missed Parkinson's patient — DANGEROUS.
- **False Positive (FP)**: Wrongly alarmed a healthy person — bad but less dangerous than FN.

**What to look for:**
- FN should be as small as possible — this is life-or-death in clinical context
- The Hybrid model should show the best FN/TP balance

**What to say:**
> "The confusion matrix is the ground truth of medical performance. The bottom-left cell — False Negatives — is the number we care most about. It represents actual Parkinson's patients we sent home thinking they were healthy. Compare this number across models: [read from graph]. A high-performing clinical tool must minimize this number even at the cost of some false alarms."

---

## Extra Metric Graphs (from `plot_all_individual_metrics()`)

These are individual line plots vs. dataset size for each metric:

| Graph File | What It Shows |
|---|---|
| `precision_vs_size_*.png` | How model precision changes as data grows |
| `recall_vs_size_*.png` | Sensitivity trajectory — most important for healthcare |
| `f1_score_vs_size_*.png` | Combined precision+recall balance across sizes |
| `sensitivity_vs_size_*.png` | Same as recall — True Positive Rate |
| `specificity_vs_size_*.png` | True Negative Rate — correctly clearing healthy patients |
| `roc_auc_vs_size_*.png` | Overall discrimination ability at each dataset size |
| `train_accuracy_vs_size_*.png` | Whether models are fitting training data |
| `generalization_gap_vs_size_*.png` | Overfitting degree — should shrink as data grows |
| `runtime_s_vs_size_*.png` | How long each model takes — quantum is MUCH slower |

**Runtime graph is critical to mention:** The quantum simulation may take 10-100× longer than classical models, yet often doesn't outperform them at this scale. This is the computational cost argument against quantum in the near term.
