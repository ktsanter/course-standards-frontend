*this is the dev branch!*
## Course standards and policies tool

| department | edit standards | view standards (read-only) |
|------------|:----------------:|:---------------------------:|
| CTE             |[edit](https://ktsanter.github.io/course-standards-frontend/index.html?department=cte&editmode)| [view](https://ktsanter.github.io/course-standards-frontend/index.html?department=cte&navmode) |
| ELA/VPA         |[edit](https://ktsanter.github.io/course-standards-frontend/index.html?department=elavpa&editmode)|[view](https://ktsanter.github.io/course-standards-frontend/index.html?department=elavpa&navmode) |
| Math            |[edit](https://ktsanter.github.io/course-standards-frontend/index.html?department=math&editmode)|[view](https://ktsanter.github.io/course-standards-frontend/index.html?department=math&navmode) |
| Science         |[edit](https://ktsanter.github.io/course-standards-frontend/index.html?department=science&editmode)|[view](https://ktsanter.github.io/course-standards-frontend/index.html?department=science&navmode) |
| Social Studies  |[edit](https://ktsanter.github.io/course-standards-frontend/index.html?department=ss&editmode)|[view](https://ktsanter.github.io/course-standards-frontend/index.html?department=ss&navmode) |
| World Languages |[edit](https://ktsanter.github.io/course-standards-frontend/index.html?department=wl&editmode)|[view](https://ktsanter.github.io/course-standards-frontend/index.html?department=wl&navmode) |
---

### Guide to controls when editing courses
![edit controls](https://drive.google.com/uc?id=169RBHhdbsM9DH8v152fkGAdFO9qzyXXm)
1. **New course** - add a course for the department

   ![new course dialog](https://drive.google.com/uc?id=1Z_caxk97TwYAnm2lWRQcYoQlvtNma1GY)  
   * The short course name must be unique for your department and isn't displayed  
   * The official course name is what's displayed  
   * Example: short = *ubw*, official = *Underwater Basket Weaving*
2. **Save course** - save the data you've entered for a course
3. **Reload course** - discard any changes and load the last saved data
4. **Delete course** - remove course from the department.  Note this is permanent and the data can't be recovered.
5. **Embed** - create the embed HTML code for the course and copy it  to the clipboard.  The course's page will be embedded in an iframe. After you paste the code you can adjust the height and width of the iframe to suit your needs.
---

### Other notes
* Many of the fields have drop down lists.  These will be populated with all of the answers entered for courses in the department.  This is handy for using the same wording in multiple courses
* Fields left blank (except for yes/no fields) won't be displayed on the view-only version for a course
* You can find the URL for the view-only version of a single course insde the embed code.  It is structured like this  
https://ktsanter.github.io/course-standards-frontend?department=xxx&course=yyy  
where *xxx* is one of *cte*, *elavpa*, *math*, *science*, *ss*, or *wl*  
and *yyy* is the short name for the course, e.g.  
https://ktsanter.github.io/course-standards-frontend?department=cte&course=fpa
