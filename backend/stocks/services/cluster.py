import pandas as pd
from sklearn.cluster import KMeans

def apply_kmeans_clustering(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies KMeans clustering to the given DataFrame.
    Features: pe_ratio, volatility_ratio, price_range.
    Adds a 'cluster' column to the DataFrame in place.
    """
    if len(df) < 3:
        # Not enough data to cluster into 3 groups reliably, just return 0
        df['cluster'] = 0
        return df
        
    features = ['pe_ratio', 'volatility_ratio', 'price_range']
    
    # Handle missing values by filling with median or 0 before clustering
    X = df[features].copy()
    X.fillna(X.median(), inplace=True)
    X.fillna(0, inplace=True)
    
    kmeans = KMeans(n_clusters=3, random_state=42, n_init='auto')
    try:
        df['cluster'] = kmeans.fit_predict(X)
        
        # Determine labels based on cluster centroids
        # We assume lower PE ratio indicates better value/performance
        cluster_means = df.groupby('cluster')['pe_ratio'].mean().sort_values()
        
        labels = {}
        if len(cluster_means) == 3:
            labels[cluster_means.index[0]] = "High performance" # Lowest PE -> High Performance
            labels[cluster_means.index[1]] = "Hold"             # Middle PE -> Hold
            labels[cluster_means.index[2]] = "Failed"           # Highest PE -> Failed
        else:
            # Fallback if fewer clusters
            for c in cluster_means.index:
                labels[c] = "Hold"
                
        df['cluster_label'] = df['cluster'].map(labels)
        
    except Exception:
        # Fallback if clustering fails
        df['cluster'] = 0
        df['cluster_label'] = "Hold"
        
    return df
