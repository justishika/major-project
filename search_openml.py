import ssl
import urllib.request
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

import openml

def find_datasets(query):
    datasets = openml.datasets.list_datasets(output_format='dataframe')
    matches = datasets[datasets['name'].str.contains(query, case=False, na=False)]
    if not matches.empty:
        print(f"--- Matches for {query} ---")
        print(matches[['did', 'name', 'NumberOfInstances', 'NumberOfFeatures']])
    else:
        print(f"No matches for {query}")

find_datasets("als")
find_datasets("amyotrophic")
find_datasets("wilson")
