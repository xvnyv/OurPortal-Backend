from bs4 import BeautifulSoup
import requests
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred, {
    'projectId': 'auth-a74c7'
})

db = firestore.client()

headers = requests.utils.default_headers()
headers.update({'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Safari/605.1.15'})

stupid_prereq_spellings = ['pre-requisite', 'pre-requisites', 'prerequisite', 'prerequisites']

def save_to_db(subject_code, title, instructor, description, type_):
    doc_ref = db.collection(u'modules').document(subject_code)
    doc_ref.set({
        u'subject_code': subject_code,
        u'title': title,
        u'instructor': instructor,
        u'description': description,
        u'type': type_
    })

def hass():
    url = 'https://hass.sutd.edu.sg/education/undergraduate-subjects/subjects-schedule/'
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    url = soup.find("a").get('href')
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    for subject in soup.find_all('a', target='_self'):
        subject_url = subject.get('href')
        subject_req = requests.get(subject_url, headers=headers)
        subject_soup = BeautifulSoup(subject_req.content, 'html.parser')
        
        entry_title = subject_soup.select('h1.entry-title')[0].text.strip()
        subject_code = entry_title.split(' ')[0]
        title = entry_title.lstrip(subject_code).strip()
        
        content = subject_soup.find('div', class_='post-content')
        description = ''
        instructor = ''
        for p in content.find_all('p'):
            instructor_p = p.find('a')
            if instructor_p == None:
                description += p.text.strip() + '\n'
            elif instructor_p.text != 'Access to Course Syllabus':
                instructor = instructor_p.text
        
        description = description.strip()
        
        save_to_db(subject_code, title, instructor, description, 'HASS')
        
        
        print(f'Subject Code: {subject_code}')
        print(f'Title: {title}')
        print(f'Instructor: {instructor}')
        print(f'Description: {description}\n====================\n')
        
def epd():
    url = 'https://epd.sutd.edu.sg/education/undergraduate/undergraduate-courses/'
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    url = soup.find("a").get('href')
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')
    
    for mod in soup.find_all('a', class_='button-sutd'):
        mod_url = mod.get('href')
        if mod_url[8:11] == 'epd':
            mod_req = requests.get(mod_url, headers=headers)
            mod_soup = BeautifulSoup(mod_req.content, 'html.parser')
            
            entry_title = mod_soup.find('h1').text
            subject_code = entry_title.split(' ')[0]
            title = entry_title.lstrip(subject_code).strip()
            
            description_div = mod_soup.find_all('div', class_='fusion-text')
            description = ''
            if len(description_div) == 0:
                description_div = mod_soup.find('div', class_='post-content')
                for el in description_div.find_all('p'):
                    if el.find('strong') != None:
                        break
                    description += el.text + '\n'
            else:
                for div in description_div:
                    is_correct_div = div.find('ul') != None
                    
                    if is_correct_div:
                        description_para = div.find_all(['p', 'li', 'h4'])
                        for el in description_para:
                            if el.name == 'h4':
                                break
                            description += el.text + '\n'
                        break
                
            save_to_db(subject_code, title, '', description.strip(), 'EPD')            
                
            print(f'Subject code: {subject_code}')
            print(f'Title: {title}')
            print(f'Description: {description}\n====================\n')
        
def esd():
    pass

def istd():
    pass

def asd():
    pass
            
    
def main():
    esd()
    
if __name__ == '__main__':
    main()