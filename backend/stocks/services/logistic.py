import pandas as pd
from sklearn.linear_model import LogisticRegression

def apply_logistic_regression(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies Logistic Regression.
    Creates label: buy_label = 1 if expected_return > 8 else 0.
    Adds: 'buy_probability', 'buy_signal'.
    """
    if len(df) < 3:
        df['buy_probability'] = 0.0
        df['buy_signal'] = "AVOID"
        return df

    # Create target label for buy/sell
    df['buy_label'] = df['expected_return'].apply(lambda x: 1 if x > 8 else 0)
    
    # We will use expected_return and volatility as features for probabilities
    # But as per request, it's just a general logistic regression on some features to get a single probability.
    # The prompt didn't specify exact features for Logistic, so we'll use pe_ratio, expected_return, volatility_ratio, cluster
    features = ['pe_ratio', 'volatility_ratio', 'cluster', 'expected_return']
    X = df[features].copy()
    y = df['buy_label']
    
    X.fillna(X.median(), inplace=True)
    X.fillna(0, inplace=True)
    
    # Check if there's only 1 class in y
    if y.nunique() <= 1:
        # Cannot train LogisticRegression with 1 class
        df['buy_probability'] = 0.0
        df['buy_signal'] = df['buy_label'].apply(lambda label: "BUY" if label == 1 else "AVOID")
        return df

    model = LogisticRegression(random_state=42)
    try:
        model.fit(X, y)
        probs = model.predict_proba(X)
        # Prob of class 1
        df['buy_probability'] = probs[:, 1]
    except Exception:
        df['buy_probability'] = 0.0

    def assign_signal(prob):
        if prob > 0.7: return "STRONG BUY"
        if prob > 0.5: return "BUY"
        if prob > 0.3: return "HOLD"
        return "AVOID"
        
    df['buy_signal'] = df['buy_probability'].apply(assign_signal)
    
    return df
