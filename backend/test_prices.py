import yfinance as yf
import pandas as pd

data = yf.download(['GC=F', 'SI=F', 'INR=X'], period='1mo')['Close']
df = pd.DataFrame({
    'gold': data['GC=F'].squeeze(),
    'silver': data['SI=F'].squeeze(),
    'fx': data['INR=X'].squeeze()
}).ffill().bfill()

df['gold_inr_10g'] = (df['gold']/31.1035)*10*df['fx']
df['silver_inr_1kg'] = (df['silver']/31.1035)*1000*df['fx']
print(df.tail())
