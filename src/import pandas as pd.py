import pandas as pd

# Load the dataset
data = pd.read_csv(r"E:\Crack\accidents_opendata.csv")

# Create a Date column
data['Date'] = pd.to_datetime(
    data[['year', 'month', 'day']]
)

# Count accidents per day
accidents = data.groupby('Date').size()

# Display the average number of accidents per day
print("Average accidents per day:", accidents.mean())