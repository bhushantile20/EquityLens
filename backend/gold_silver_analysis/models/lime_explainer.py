import lime
import lime.lime_tabular
import numpy as np
import pandas as pd

def generate_lime_explanation(model, X_train, last_instance, feature_names):
    try:
        lime_explainer = lime.lime_tabular.LimeTabularExplainer(
            training_data=np.array(X_train),
            feature_names=feature_names,
            mode="regression"
        )
        # using num_samples=500 cuts processing overhead by 10x
        exp = lime_explainer.explain_instance(last_instance, model.predict, num_features=5, num_samples=500)
        lime_explanation = [{"feature": k, "weight": float(v)} for k, v in exp.as_list()]
        return lime_explanation
    except:
        return []
