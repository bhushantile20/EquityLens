import shap
import numpy as np

def generate_shap_values(model, X_train, X_test):
    """
    Generate SHAP values using LinearExplainer for LinearRegression.
    Returns mean absolute SHAP values and feature importance.
    """
    try:
        # Use LinearExplainer for LinearRegression
        explainer = shap.LinearExplainer(model, X_train)
        # Sample for speed
        X_sample = X_test.sample(min(100, len(X_test)))
        shap_values = explainer.shap_values(X_sample)
        
        # mean_abs_shap for comparisons
        mean_shap = np.abs(shap_values).mean(axis=0)
        mean_abs_shap = {col: float(imp) for col, imp in zip(X_train.columns, mean_shap)}
        
        # sample_values for detailed plots (optional, but requested)
        sample_values = shap_values.tolist()
        
        feature_importance = [{"name": col, "value": float(imp)} for col, imp in zip(X_train.columns, mean_shap)]
        feature_importance.sort(key=lambda x: x["value"], reverse=True)
        
        return {
            "mean_abs_shap": mean_abs_shap,
            "sample_values": sample_values,
            "feature_importance": feature_importance,
            "feature_names": list(X_train.columns)
        }
    except Exception as e:
        print(f"SHAP Error: {e}")
        return {
            "mean_abs_shap": {f: 0.0 for f in X_train.columns},
            "sample_values": [],
            "feature_importance": [{"name": f, "value": 0.0} for f in X_train.columns],
            "feature_names": list(X_train.columns)
        }
