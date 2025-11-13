from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os
import tempfile
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER
import markdown

app = FastAPI(title="GitHub Profile Scraper API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    username: str

class PDFRequest(BaseModel):
    username: str
    profile: dict
    repos: list

def scrape_github_profile(username: str):
    """
    Scrape GitHub profile and repositories
    """
    try:
        # GitHub profile URL
        profile_url = f"https://github.com/{username}"
        
        # Set headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Request the profile page
        response = requests.get(profile_url, headers=headers)
        
        if response.status_code == 404:
            return None
        
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract profile information
        profile_data = {
            'username': username,
            'name': '',
            'avatar': '',
            'bio': '',
            'followers': 0,
            'following': 0,
            'email': '',
            'location': '',
            'company': '',
            'website': '',
            'twitter': ''
        }
        
        # Avatar
        avatar_img = soup.find('img', {'alt': f'@{username}'})
        if avatar_img and 'src' in avatar_img.attrs:
            profile_data['avatar'] = avatar_img['src']
        
        # Name
        name_elem = soup.find('span', {'class': 'p-name'})
        if name_elem:
            profile_data['name'] = name_elem.text.strip()
        
        # Bio
        bio_elem = soup.find('div', {'class': 'p-note'})
        if bio_elem:
            profile_data['bio'] = bio_elem.text.strip()
        
        # Followers and Following
        followers_elem = soup.find('a', href=f'/{username}?tab=followers')
        if followers_elem:
            followers_text = followers_elem.find('span', {'class': 'text-bold'})
            if followers_text:
                profile_data['followers'] = followers_text.text.strip()
        
        following_elem = soup.find('a', href=f'/{username}?tab=following')
        if following_elem:
            following_text = following_elem.find('span', {'class': 'text-bold'})
            if following_text:
                profile_data['following'] = following_text.text.strip()
        
        # Email
        email_elem = soup.find('a', {'class': 'Link--primary'})
        if email_elem and 'mailto:' in email_elem.get('href', ''):
            profile_data['email'] = email_elem.text.strip()
        
        # Location
        location_elem = soup.find('span', {'class': 'p-label'})
        if location_elem:
            profile_data['location'] = location_elem.text.strip()
        
        # Company
        company_elem = soup.find('span', {'class': 'p-org'})
        if company_elem:
            profile_data['company'] = company_elem.text.strip()
        
        # Website
        website_elem = soup.find('a', {'class': 'Link--primary'})
        if website_elem and 'mailto:' not in website_elem.get('href', ''):
            profile_data['website'] = website_elem.get('href', '')
        
        # Scrape repositories
        repos_url = f"https://github.com/{username}?tab=repositories"
        repos_response = requests.get(repos_url, headers=headers)
        repos_soup = BeautifulSoup(repos_response.text, 'html.parser')
        
        repos_data = []
        repo_list = repos_soup.find_all('li', {'class': lambda x: x and 'col-12' in x})
        
        for repo in repo_list[:10]:  # Get top 10 repos
            repo_info = {}
            
            # Repository name and link
            repo_link = repo.find('a', {'itemprop': 'name codeRepository'})
            if repo_link:
                repo_info['name'] = repo_link.text.strip()
                repo_info['url'] = f"https://github.com{repo_link['href']}"
            
            # Description
            desc_elem = repo.find('p', {'itemprop': 'description'})
            repo_info['description'] = desc_elem.text.strip() if desc_elem else ''
            
            # Language
            lang_elem = repo.find('span', {'itemprop': 'programmingLanguage'})
            repo_info['language'] = lang_elem.text.strip() if lang_elem else 'N/A'
            
            # Stars
            stars_elem = repo.find('a', href=lambda x: x and '/stargazers' in x)
            if stars_elem:
                stars_text = stars_elem.text.strip()
                repo_info['stars'] = stars_text if stars_text else '0'
            else:
                repo_info['stars'] = '0'
            
            # Forks
            forks_elem = repo.find('a', href=lambda x: x and '/forks' in x)
            if forks_elem:
                forks_text = forks_elem.text.strip()
                repo_info['forks'] = forks_text if forks_text else '0'
            else:
                repo_info['forks'] = '0'
            
            # Last updated
            time_elem = repo.find('relative-time')
            if time_elem and 'datetime' in time_elem.attrs:
                repo_info['updated'] = time_elem['datetime']
            else:
                repo_info['updated'] = ''
            
            if 'name' in repo_info:
                repos_data.append(repo_info)
        
        return {
            'profile': profile_data,
            'repos': repos_data
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error scraping GitHub: {str(e)}")

@app.get("/")
async def root():
    return {"message": "GitHub Profile Scraper API", "version": "1.0.0"}

@app.post("/scrape")
async def scrape_profile(request: ScrapeRequest):
    """
    Scrape GitHub profile and repositories
    """
    username = request.username.strip()
    
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    
    data = scrape_github_profile(username)
    
    if data is None:
        raise HTTPException(status_code=404, detail="GitHub user not found")
    
    return data

@app.get("/readme/{username}/{repo}")
async def get_readme(username: str, repo: str):
    """
    Fetch README content from a GitHub repository and return as HTML
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Try to fetch README using GitHub API first (better structured data)
        api_url = f"https://api.github.com/repos/{username}/{repo}/readme"
        api_response = requests.get(api_url, headers=headers)
        
        if api_response.status_code == 200:
            readme_data = api_response.json()
            # GitHub API returns base64 encoded content
            import base64
            content = base64.b64decode(readme_data['content']).decode('utf-8')
            
            # Convert markdown to HTML
            html_content = markdown.markdown(
                content,
                extensions=['fenced_code', 'tables', 'nl2br']
            )
            
            return {
                'content': html_content,
                'html_url': readme_data['html_url'],
                'is_html': True
            }
        
        # Fallback: scrape the README from the repo page
        readme_url = f"https://github.com/{username}/{repo}"
        response = requests.get(readme_url, headers=headers)
        
        if response.status_code != 200:
            return {
                'content': '<p>README not available</p>',
                'html_url': readme_url,
                'is_html': True
            }
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find README content
        readme_elem = soup.find('article', {'class': lambda x: x and 'markdown-body' in x})
        
        if readme_elem:
            # Return the HTML content for proper rendering
            readme_html = str(readme_elem)
            return {
                'content': readme_html,
                'html_url': f"{readme_url}#readme",
                'is_html': True
            }
        
        return {
            'content': '<p>README not found</p>',
            'html_url': readme_url,
            'is_html': True
        }
        
    except Exception as e:
        return {
            'content': f'<p>Error fetching README: {str(e)}</p>',
            'html_url': f"https://github.com/{username}/{repo}",
            'is_html': True
        }

@app.post("/generate-pdf")
async def generate_pdf(request: PDFRequest):
    """
    Generate PDF from profile and repository data
    """
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            pdf_path = tmp_file.name
        
        # Create PDF document
        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#0366d6'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#0366d6'),
            spaceAfter=12
        )
        
        # Title
        story.append(Paragraph("GitHub Profile Report", title_style))
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles['Normal']))
        story.append(Spacer(1, 30))
        
        # Profile Section
        story.append(Paragraph("Profile Information", heading_style))
        story.append(Spacer(1, 12))
        
        # Profile data table - only showing what's in the UI
        profile_data = [
            ['Username', request.username],
            ['Name', request.profile.get('name', 'N/A')],
            ['Bio', request.profile.get('bio', 'No bio available')]
        ]
        
        # Add location if available
        if request.profile.get('location'):
            profile_data.append(['Location', request.profile.get('location')])
        
        # Add company if available
        if request.profile.get('company'):
            profile_data.append(['Company', request.profile.get('company')])
        
        # Add email if available
        if request.profile.get('email'):
            profile_data.append(['Email', request.profile.get('email')])
        
        profile_table = Table(profile_data, colWidths=[2*inch, 4.5*inch])
        profile_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        
        story.append(profile_table)
        story.append(Spacer(1, 30))
        
        # Repositories Section
        story.append(Paragraph(f"Top Repositories ({len(request.repos)})", heading_style))
        story.append(Spacer(1, 12))
        
        if request.repos:
            # Repository table - matching the UI (Repository, Language, Last Updated)
            repo_data = [['Repository', 'Language', 'Last Updated']]
            
            for repo in request.repos:
                # Format the date if available
                updated = repo.get('updated', 'N/A')
                if updated and updated != 'N/A':
                    try:
                        date_obj = datetime.fromisoformat(updated.replace('Z', '+00:00'))
                        updated = date_obj.strftime('%b %d, %Y %I:%M %p')
                    except:
                        pass
                
                repo_data.append([
                    repo.get('name', 'N/A'),
                    repo.get('language', 'N/A'),
                    updated
                ])
            
            repo_table = Table(repo_data, colWidths=[2.5*inch, 1.5*inch, 2*inch])
            repo_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dbeafe')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bfdbfe')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
            ]))
            
            story.append(repo_table)
        else:
            story.append(Paragraph("No public repositories found.", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        
        # Return PDF file
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f'{request.username}_github_profile.pdf',
            headers={'Content-Disposition': f'attachment; filename="{request.username}_github_profile.pdf"'}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
