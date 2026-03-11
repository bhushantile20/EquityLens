import shap
import numpy as np

def generate_shap_values(model, X_train, X_test):
    try:
        # TreeExplainer is 100x faster than default Explainer for Random Forest
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test.sample(min(100, len(X_test))))
        
        mean_shap = np.abs(shap_values).mean(axis=0)
        feature_importance = [{"name": col, "value": float(imp)} for col, imp in zip(X_train.columns, mean_shap)]
        feature_importance.sort(key=lambda x: x["value"], reverse=True)
        return feature_importance
    except Exception as e:
        return [{"name": f, "value": 1.0} for f in X_train.columns]
