import lime
import lime.lime_tabular
import numpy as np
import pandas as pd

def generate_lime_explanation(model, X_train, last_instance, feature_names):
    """
    Generate LIME explanation using LimeTabularExplainer.
    Parameters: kernel_width=0.75, num_samples=500, mode="regression".
    """
    try:
        lime_explainer = lime.lime_tabular.LimeTabularExplainer(
            training_data=np.array(X_train),
            feature_names=feature_names,
            mode="regression",
            kernel_width=0.75
        )
        
        # Explain the last instance
        exp = lime_explainer.explain_instance(
            last_instance, 
            model.predict, 
            num_features=len(feature_names), 
            num_samples=500
        )
        
        # weights structure for charts
        weights = {str(k): float(v) for k, v in exp.as_list()}
        
        # Correctly extract intercept
        intercept = 0.0
        try:
            if hasattr(exp, 'intercept') and exp.intercept is not None:
                if isinstance(exp.intercept, dict):
                    intercept = float(list(exp.intercept.values())[0])
                elif isinstance(exp.intercept, (list, np.ndarray)):
                    intercept = float(exp.intercept[0])
                else:
                    intercept = float(exp.intercept)
        except:
            pass

        return {
            "weights": weights,
            "prediction": float(exp.predicted_value) if hasattr(exp, 'predicted_value') else 0.0,
            "intercept": intercept,
            "feature_names": feature_names
        }
    except Exception as e:
        print(f"LIME Error: {e}")
        return {
            "weights": {f: 0.0 for f in feature_names},
            "prediction": 0.0,
            "intercept": 0.0,
            "feature_names": feature_names
        }
