import os
import glob

def generate_report():
    datasets = [
        'parkinsons', 'breast_cancer', 'hepatitis_c', 
        'heart_disease', 'mammographic_mass', 'thyroid_disease'
    ]
    
    report_path = "multi_disease_benchmark_report.md"
    graphs_dir = os.path.join("results", "graphs")
    
    with open(report_path, "w") as f:
        f.write("# Comprehensive Benchmark Results: Hybrid Classical-Quantum Stacking\n\n")
        f.write("This document contains the complete set of results for all 6 disease datasets evaluated using the `ishika-2-multi-disease-hybrid-stacking` branch codebase.\n\n")
        
        # Cross-disease comparison
        f.write("## Overall Cross-Disease Comparison\n\n")
        cross_disease_img = os.path.join(graphs_dir, "cross_disease_summary.png")
        if os.path.exists(cross_disease_img):
            f.write(f"![Cross Disease Summary]({os.path.abspath(cross_disease_img)})\n\n")
        else:
            f.write("*Cross-disease summary graph not found (main.py might not have completed).* \n\n")
            
        # Individual Diseases
        for dataset in datasets:
            f.write(f"## {dataset.replace('_', ' ').title()} Evaluation\n\n")
            ds_dir = os.path.join(graphs_dir, dataset)
            
            if os.path.exists(ds_dir):
                images = glob.glob(os.path.join(ds_dir, "*.png"))
                if not images:
                    f.write("*No graphs generated yet for this dataset.*\n\n")
                    continue
                
                # Sort images logically if possible, otherwise alphabetically
                images.sort()
                for img_path in images:
                    img_name = os.path.basename(img_path).replace(".png", "").replace("_", " ").title()
                    f.write(f"### {img_name}\n")
                    f.write(f"![{img_name}]({os.path.abspath(img_path)})\n\n")
            else:
                f.write(f"*Dataset folder not found. Ensure `main.py` finished running for {dataset}.*\n\n")
                
        f.write("---\n")
        f.write("**Data Files:** Raw benchmark data is available in `results/data/benchmark_results.csv`.\n")
        
    print(f"Report successfully generated at: {os.path.abspath(report_path)}")

if __name__ == "__main__":
    generate_report()
