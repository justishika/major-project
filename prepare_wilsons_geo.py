"""
Prepare Wilson's disease GEO dataset GDS2509 for the benchmark pipeline.

Input:  GDS2509.soft from GEO/NCBI
Output: wilsons_clean.csv with sample rows, binary labels, and PCA features.

Labels:
    0 = wild-type control
    1 = ATP7B-null Wilson's disease model
"""

from io import StringIO
from pathlib import Path

import pandas as pd
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler


DEFAULT_SOFT_PATH = Path('/Users/shrinidhipawar/Downloads/GDS2509.soft')
DEFAULT_OUTPUT_PATH = Path(__file__).resolve().parent / 'wilsons_clean.csv'


def parse_gds2509_soft(soft_path):
    """Parse sample metadata and expression table from a GEO SOFT file."""
    subsets = {}
    current_subset = None
    sample_notes = {}
    table_lines = []
    in_table = False

    with Path(soft_path).open('r', encoding='utf-8', errors='replace') as handle:
        for raw in handle:
            line = raw.rstrip('\n')

            if line.startswith('^SUBSET'):
                current_subset = line.split('=', 1)[1].strip()
                subsets[current_subset] = {'description': '', 'sample_ids': []}
                continue

            if current_subset and line.startswith('!subset_description'):
                subsets[current_subset]['description'] = line.split('=', 1)[1].strip()
                continue

            if current_subset and line.startswith('!subset_sample_id'):
                value = line.split('=', 1)[1].strip()
                subsets[current_subset]['sample_ids'] = [
                    sample.strip() for sample in value.split(',') if sample.strip()
                ]
                continue

            if line.startswith('#GSM') and '=' in line:
                sample_id, note = line[1:].split('=', 1)
                sample_notes[sample_id.strip()] = note.strip()
                continue

            if line == '!dataset_table_begin':
                in_table = True
                continue

            if line == '!dataset_table_end':
                in_table = False
                continue

            if in_table:
                table_lines.append(line)

    if not table_lines:
        raise ValueError(f'No !dataset_table block found in {soft_path}')

    table = pd.read_csv(
        StringIO('\n'.join(table_lines)),
        sep='\t',
        na_values=['null', 'NULL', 'Null', 'NA', ''],
    )
    sample_ids = [column for column in table.columns if column.startswith('GSM')]
    if not sample_ids:
        raise ValueError('No GSM sample columns found in the dataset table')

    labels = {}
    label_names = {}
    for subset in subsets.values():
        description = subset['description'].strip().lower()
        if 'wild type' in description or description in {'wt', 'control', 'normal'}:
            label, label_name = 0, 'control'
        elif 'atp7b' in description or 'null' in description or 'wilson' in description:
            label, label_name = 1, 'wilsons_disease'
        else:
            continue

        for sample_id in subset['sample_ids']:
            labels[sample_id] = label
            label_names[sample_id] = label_name

    missing = [sample_id for sample_id in sample_ids if sample_id not in labels]
    if missing:
        raise ValueError(f'Missing disease/control labels for samples: {missing}')

    return table, sample_ids, labels, label_names, sample_notes


def build_wilsons_clean_csv(soft_path=DEFAULT_SOFT_PATH, output_path=DEFAULT_OUTPUT_PATH, n_components=4):
    """Create the PCA-ready Wilson's CSV used by data_preprocessing.py."""
    table, sample_ids, labels, label_names, sample_notes = parse_gds2509_soft(soft_path)

    feature_meta = table[['ID_REF', 'IDENTIFIER']].copy()
    expression = table[sample_ids].apply(pd.to_numeric, errors='coerce')

    usable_probe_mask = expression.notna().any(axis=1)
    usable_probe_mask &= feature_meta['IDENTIFIER'].fillna('').ne('--Control')

    expression = expression.loc[usable_probe_mask]
    feature_meta = feature_meta.loc[usable_probe_mask]

    # GEO table is probes x samples; ML expects samples x features.
    X = expression.T
    X.columns = feature_meta['ID_REF'].astype(str).values
    X = X.loc[:, X.notna().any(axis=0)]

    X_imputed = SimpleImputer(strategy='median').fit_transform(X)
    X_standardized = StandardScaler().fit_transform(X_imputed)

    n_components = min(n_components, X_standardized.shape[0] - 1, X_standardized.shape[1])
    pca = PCA(n_components=n_components, random_state=42)
    X_pca = pca.fit_transform(X_standardized)

    cleaned = pd.DataFrame(X_pca, columns=[f'PC{i + 1}' for i in range(n_components)])
    cleaned.insert(0, 'label_name', [label_names[sample_id] for sample_id in X.index])
    cleaned.insert(0, 'label', [labels[sample_id] for sample_id in X.index])
    cleaned.insert(0, 'sample_id', X.index)
    cleaned['source'] = 'GDS2509'
    cleaned['soft_sample_description'] = [sample_notes.get(sample_id, '') for sample_id in X.index]

    output_path = Path(output_path)
    cleaned.to_csv(output_path, index=False)

    return {
        'output_path': str(output_path),
        'samples': len(cleaned),
        'raw_probe_rows': len(table),
        'usable_gene_features': X.shape[1],
        'pca_components': n_components,
        'class_counts': cleaned['label'].value_counts().sort_index().to_dict(),
        'pca_explained_variance': float(pca.explained_variance_ratio_.sum()),
    }


if __name__ == '__main__':
    summary = build_wilsons_clean_csv()
    for key, value in summary.items():
        print(f'{key}: {value}')
